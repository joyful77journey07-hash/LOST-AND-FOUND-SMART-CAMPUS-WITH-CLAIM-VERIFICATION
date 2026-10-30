const express = require('express');
const router = express.Router();
const db = require('../db');
const { auth, adminOnly } = require('../middleware/auth');

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM Categories ORDER BY category_name').all());
});

router.post('/', auth, adminOnly, (req, res) => {
  const { category_name } = req.body;
  if (!category_name) return res.status(400).json({ error: 'category_name required' });
  try {
    const r = db.prepare('INSERT INTO Categories (category_name) VALUES (?)').run(category_name);
    res.json({ category_id: r.lastInsertRowid, category_name });
  } catch (e) { res.status(400).json({ error: 'Category already exists' }); }
});

router.put('/:id', auth, adminOnly, (req, res) => {
  const { category_name } = req.body;
  db.prepare('UPDATE Categories SET category_name=? WHERE category_id=?').run(category_name, req.params.id);
  res.json({ ok: true });
});

router.delete('/:id', auth, adminOnly, (req, res) => {
  db.prepare('DELETE FROM Categories WHERE category_id=?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
