const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { auth, adminOnly } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + Math.round(Math.random()*1e9) + ext);
  }
});
const upload = multer({ storage, limits: { fileSize: 5*1024*1024 } });

// List with filters
router.get('/', (req, res) => {
  const { keyword, type, category, location, dateFrom, dateTo } = req.query;
  let sql = `SELECT i.*, c.category_name, u.name AS reporter_name
             FROM Items i LEFT JOIN Categories c ON i.category_id=c.category_id
             LEFT JOIN Users u ON i.reported_by=u.user_id WHERE 1=1`;
  const params = [];
  if (keyword) { sql += ' AND (i.name LIKE ? OR i.description LIKE ? OR i.location LIKE ?)'; const k='%'+keyword+'%'; params.push(k,k,k); }
  if (type) { sql += ' AND i.type=?'; params.push(type); }
  if (category) { sql += ' AND i.category_id=?'; params.push(category); }
  if (location) { sql += ' AND i.location LIKE ?'; params.push('%'+location+'%'); }
  if (dateFrom) { sql += ' AND i.item_date >= ?'; params.push(dateFrom); }
  if (dateTo) { sql += ' AND i.item_date <= ?'; params.push(dateTo); }
  sql += ' ORDER BY i.created_at DESC';
  const rows = db.prepare(sql).all(...params);
  // never expose hidden_verification in list
  rows.forEach(r => delete r.hidden_verification);
  res.json(rows);
});

// Single item detail (public fields; hidden only to admin/reporter)
router.get('/:id', (req, res) => {
  const row = db.prepare(`SELECT i.*, c.category_name, u.name AS reporter_name, u.contact AS reporter_contact, u.email AS reporter_email
             FROM Items i LEFT JOIN Categories c ON i.category_id=c.category_id
             LEFT JOIN Users u ON i.reported_by=u.user_id WHERE i.item_id=?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  // auth optional: check token
  let user = null;
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (token) { try { user = require('jsonwebtoken').verify(token, require('../middleware/auth').SECRET); } catch(e){} }
  const isPrivileged = user && (user.role === 'admin' || user.user_id === row.reported_by);
  if (!isPrivileged) delete row.hidden_verification;
  res.json(row);
});

// Create item
router.post('/', auth, upload.single('image'), (req, res) => {
  const { type, name, category_id, description, location, item_date, contact_info, hidden_verification } = req.body;
  if (!type || !name) return res.status(400).json({ error: 'type and name required' });
  let image_path = null;
  if (req.file) image_path = '/uploads/' + req.file.filename;
  const hv = (type === 'found') ? (hidden_verification || '') : null;
  const r = db.prepare(`INSERT INTO Items (type,name,category_id,description,location,item_date,image_path,contact_info,hidden_verification,status,reported_by)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run(type, name, category_id || null, description || '', location || '', item_date || '', image_path, contact_info || '', hv, 'open', req.user.user_id);
  res.json({ item_id: r.lastInsertRowid });
});

// Update status
router.put('/:id/status', auth, (req, res) => {
  const { status } = req.body;
  const item = db.prepare('SELECT * FROM Items WHERE item_id=?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  if (req.user.role !== 'admin' && req.user.user_id !== item.reported_by) return res.status(403).json({ error: 'Forbidden' });
  const allowed = ['open','claimed','returned','resolved'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'bad status' });
  db.prepare('UPDATE Items SET status=? WHERE item_id=?').run(status, req.params.id);
  res.json({ ok: true });
});

// Delete item
router.delete('/:id', auth, (req, res) => {
  const item = db.prepare('SELECT * FROM Items WHERE item_id=?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  if (req.user.role !== 'admin' && req.user.user_id !== item.reported_by) return res.status(403).json({ error: 'Forbidden' });
  db.prepare('DELETE FROM Items WHERE item_id=?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
