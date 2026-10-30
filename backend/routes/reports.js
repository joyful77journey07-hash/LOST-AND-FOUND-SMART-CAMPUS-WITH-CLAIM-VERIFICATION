const express = require('express');
const router = express.Router();
const db = require('../db');
const { auth } = require('../middleware/auth');

// Any logged-in user can report another user (e.g. a suspicious claimant)
router.post('/', auth, (req, res) => {
  const { reported_user_id, claim_id, item_id, description } = req.body;
  if (!reported_user_id || !description || !String(description).trim()) {
    return res.status(400).json({ error: 'reported_user_id and description are required' });
  }
  if (Number(reported_user_id) === req.user.user_id) return res.status(400).json({ error: 'You cannot report yourself' });
  const target = db.prepare('SELECT user_id, role FROM Users WHERE user_id=?').get(reported_user_id);
  if (!target) return res.status(404).json({ error: 'User not found' });
  if (target.role === 'admin') return res.status(400).json({ error: 'Admin cannot be reported' });
  const r = db.prepare('INSERT INTO UserReports (reported_user_id, reporter_id, claim_id, item_id, description) VALUES (?,?,?,?,?)')
    .run(reported_user_id, req.user.user_id, claim_id || null, item_id || null, String(description).trim());
  res.status(201).json({ ok: true, report_id: r.lastInsertRowid });
});

// Reports I have made
router.get('/mine', auth, (req, res) => {
  res.json(db.prepare(`SELECT r.*, u.name AS reported_name, u.email AS reported_email
    FROM UserReports r JOIN Users u ON u.user_id=r.reported_user_id
    WHERE r.reporter_id=? ORDER BY r.created_at DESC`).all(req.user.user_id));
});

module.exports = router;
