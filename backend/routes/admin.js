const express = require('express');
const router = express.Router();
const db = require('../db');
const { auth, adminOnly } = require('../middleware/auth');

router.get('/stats', auth, adminOnly, (req, res) => {
  const users = db.prepare('SELECT COUNT(*) c FROM Users').get().c;
  const items = db.prepare('SELECT COUNT(*) c FROM Items').get().c;
  const lost = db.prepare("SELECT COUNT(*) c FROM Items WHERE type='lost'").get().c;
  const found = db.prepare("SELECT COUNT(*) c FROM Items WHERE type='found'").get().c;
  const claims = db.prepare('SELECT COUNT(*) c FROM Claims').get().c;
  const pending = db.prepare("SELECT COUNT(*) c FROM Claims WHERE status='Pending'").get().c;
  const returned = db.prepare("SELECT COUNT(*) c FROM Items WHERE status='returned'").get().c;
  const flagged = db.prepare('SELECT COUNT(DISTINCT reported_user_id) c FROM UserReports').get().c;
  const blocked = db.prepare('SELECT COUNT(*) c FROM Users WHERE blocked=1').get().c;
  res.json({ users, items, lost, found, claims, pending, returned, flagged, blocked });
});

router.get('/users', auth, adminOnly, (req, res) => {
  res.json(db.prepare('SELECT user_id,name,email,roll_no,role,contact,blocked,blocked_reason,created_at FROM Users ORDER BY created_at DESC').all());
});

// Flagged users: everyone who has at least one report against them
router.get('/flagged', auth, adminOnly, (req, res) => {
  const rows = db.prepare(`SELECT u.user_id, u.name, u.email, u.roll_no, u.contact, u.blocked, u.blocked_reason,
      COUNT(r.report_id) AS report_count, MAX(r.created_at) AS last_reported
    FROM UserReports r JOIN Users u ON u.user_id = r.reported_user_id
    GROUP BY u.user_id ORDER BY report_count DESC, last_reported DESC`).all();
  res.json(rows);
});

// Search a user by email (partial match) and return everything about them
router.get('/users/search', auth, adminOnly, (req, res) => {
  const q = String(req.query.email || '').trim().toLowerCase();
  if (!q) return res.status(400).json({ error: 'email query required' });
  const users = db.prepare(`SELECT user_id,name,email,roll_no,role,contact,photo_path,blocked,blocked_reason,created_at
    FROM Users WHERE lower(email) LIKE ? ORDER BY email LIMIT 10`).all('%' + q + '%');
  res.json(users);
});

// Full details of one user (profile, items, claims, reports against them, reports they made)
router.get('/users/:id/details', auth, adminOnly, (req, res) => {
  const id = req.params.id;
  const user = db.prepare(`SELECT user_id,name,email,roll_no,role,contact,photo_path,blocked,blocked_reason,created_at FROM Users WHERE user_id=?`).get(id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const items = db.prepare(`SELECT i.item_id,i.type,i.name,i.status,i.location,i.item_date,i.created_at,c.category_name
    FROM Items i LEFT JOIN Categories c ON c.category_id=i.category_id WHERE i.reported_by=? ORDER BY i.created_at DESC`).all(id);
  const claims = db.prepare(`SELECT cl.claim_id,cl.status,cl.created_at,cl.claim_description,i.name AS item_name,i.item_id
    FROM Claims cl JOIN Items i ON i.item_id=cl.item_id WHERE cl.claimant_id=? ORDER BY cl.created_at DESC`).all(id);
  const reportsAgainst = db.prepare(`SELECT r.*, rep.name AS reporter_name, rep.email AS reporter_email, i.name AS item_name
    FROM UserReports r JOIN Users rep ON rep.user_id=r.reporter_id LEFT JOIN Items i ON i.item_id=r.item_id
    WHERE r.reported_user_id=? ORDER BY r.created_at DESC`).all(id);
  const reportsMade = db.prepare(`SELECT r.*, t.name AS reported_name, t.email AS reported_email
    FROM UserReports r JOIN Users t ON t.user_id=r.reported_user_id WHERE r.reporter_id=? ORDER BY r.created_at DESC`).all(id);
  res.json({ user, items, claims, reportsAgainst, reportsMade });
});

// Block / unblock a user
router.put('/users/:id/block', auth, adminOnly, (req, res) => {
  const { blocked, reason } = req.body;
  const u = db.prepare('SELECT user_id, role FROM Users WHERE user_id=?').get(req.params.id);
  if (!u) return res.status(404).json({ error: 'User not found' });
  if (u.role === 'admin') return res.status(400).json({ error: 'Cannot block an admin' });
  db.prepare('UPDATE Users SET blocked=?, blocked_reason=? WHERE user_id=?').run(blocked ? 1 : 0, blocked ? (reason || null) : null, req.params.id);
  res.json({ ok: true, blocked: blocked ? 1 : 0 });
});

// Mark a report reviewed / dismissed
router.put('/reports/:id', auth, adminOnly, (req, res) => {
  const { status } = req.body;
  if (!['open','reviewed','dismissed'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  db.prepare('UPDATE UserReports SET status=? WHERE report_id=?').run(status, req.params.id);
  res.json({ ok: true });
});

router.delete('/users/:id', auth, adminOnly, (req, res) => {
  db.prepare('DELETE FROM Users WHERE user_id=? AND role!=\'admin\'').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
