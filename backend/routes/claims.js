const express = require('express');
const router = express.Router();
const db = require('../db');
const { auth, adminOnly } = require('../middleware/auth');

// Submit claim (only on found items)
router.post('/', auth, (req, res) => {
  const { item_id, lost_location, approx_datetime, claim_description, unique_features, extra_info } = req.body;
  const item = db.prepare('SELECT * FROM Items WHERE item_id=?').get(item_id);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  if (item.type !== 'found') return res.status(400).json({ error: 'Claims only on found items' });
  if (item.reported_by === req.user.user_id) return res.status(400).json({ error: 'Cannot claim your own item' });
  const r = db.prepare(`INSERT INTO Claims (item_id,claimant_id,lost_location,approx_datetime,claim_description,unique_features,extra_info,status)
    VALUES (?,?,?,?,?,?,?,?)`).run(item_id, req.user.user_id, lost_location||'', approx_datetime||'', claim_description||'', unique_features||'', extra_info||'', 'Pending');
  // mark item claimed
  db.prepare("UPDATE Items SET status='claimed' WHERE item_id=? AND status='open'").run(item_id);
  res.json({ claim_id: r.lastInsertRowid });
});

// List claims: admin all; finder sees claims on own items; claimant sees own
router.get('/', auth, (req, res) => {
  let sql = `SELECT cl.*, i.name AS item_name, i.type AS item_type, i.hidden_verification, i.reported_by AS item_reporter,
             u.name AS claimant_name, u.email AS claimant_email, u.contact AS claimant_contact,
             rep.name AS reporter_name
             FROM Claims cl JOIN Items i ON cl.item_id=i.item_id
             JOIN Users u ON cl.claimant_id=u.user_id
             JOIN Users rep ON i.reported_by=rep.user_id`;
  const params = [];
  if (req.user.role !== 'admin') {
    sql += ' WHERE (cl.claimant_id=? OR i.reported_by=?)';
    params.push(req.user.user_id, req.user.user_id);
  }
  sql += ' ORDER BY cl.created_at DESC';
  const rows = db.prepare(sql).all(...params);
  // hide hidden_verification unless admin or finder
  rows.forEach(r => {
    if (req.user.role !== 'admin' && req.user.user_id !== r.reported_by_placeholder) {}
  });
  // determine finder per row
  rows.forEach(r => {
    const item = db.prepare('SELECT reported_by FROM Items WHERE item_id=?').get(r.item_id);
    const privileged = req.user.role === 'admin' || req.user.user_id === item.reported_by;
    if (!privileged) delete r.hidden_verification;
  });
  res.json(rows);
});

router.get('/:id', auth, (req, res) => {
  const row = db.prepare(`SELECT cl.*, i.name AS item_name, i.hidden_verification, i.reported_by AS item_reporter,
             u.name AS claimant_name, u.email AS claimant_email, u.contact AS claimant_contact
             FROM Claims cl JOIN Items i ON cl.item_id=i.item_id JOIN Users u ON cl.claimant_id=u.user_id
             WHERE cl.claim_id=?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  const privileged = req.user.role === 'admin' || req.user.user_id === row.item_reporter || req.user.user_id === row.claimant_id;
  // claimant shouldn't see hidden verification
  if (!(req.user.role === 'admin' || req.user.user_id === row.item_reporter)) delete row.hidden_verification;
  // access control: claimant, finder, admin
  if (!(req.user.role === 'admin' || req.user.user_id === row.item_reporter || req.user.user_id === row.claimant_id)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  res.json(row);
});

// Review claim: set Under Review / Approved / Rejected + remarks
router.put('/:id/review', auth, (req, res) => {
  const { status, remarks } = req.body;
  const claim = db.prepare('SELECT cl.*, i.reported_by FROM Claims cl JOIN Items i ON cl.item_id=i.item_id WHERE cl.claim_id=?').get(req.params.id);
  if (!claim) return res.status(404).json({ error: 'Not found' });
  if (req.user.role !== 'admin' && req.user.user_id !== claim.reported_by) return res.status(403).json({ error: 'Forbidden' });
  const allowed = ['Under Review', 'Approved', 'Rejected'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'bad status' });
  db.prepare('UPDATE Claims SET status=?, remarks=? WHERE claim_id=?').run(status, remarks || '', req.params.id);
  if (status === 'Approved') {
    db.prepare("UPDATE Items SET status='claimed' WHERE item_id=?").run(claim.item_id);
  } else if (status === 'Rejected') {
    // reopen item if no other pending claims
    const pending = db.prepare("SELECT COUNT(*) c FROM Claims WHERE item_id=? AND status IN ('Pending','Under Review')").get(claim.item_id).c;
    if (pending === 0) db.prepare("UPDATE Items SET status='open' WHERE item_id=?").run(claim.item_id);
  }
  res.json({ ok: true });
});

// Resolve: mark claim Resolved and item Returned
router.put('/:id/resolve', auth, (req, res) => {
  const claim = db.prepare('SELECT cl.*, i.reported_by FROM Claims cl JOIN Items i ON cl.item_id=i.item_id WHERE cl.claim_id=?').get(req.params.id);
  if (!claim) return res.status(404).json({ error: 'Not found' });
  if (req.user.role !== 'admin' && req.user.user_id !== claim.reported_by) return res.status(403).json({ error: 'Forbidden' });
  db.prepare("UPDATE Claims SET status='Resolved' WHERE claim_id=?").run(req.params.id);
  db.prepare("UPDATE Items SET status='returned' WHERE item_id=?").run(claim.item_id);
  res.json({ ok: true });
});

module.exports = router;
