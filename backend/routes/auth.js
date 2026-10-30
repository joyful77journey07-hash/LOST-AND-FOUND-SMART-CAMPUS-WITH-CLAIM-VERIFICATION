const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { auth, SECRET } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, 'user-' + Date.now() + '-' + Math.round(Math.random()*1e9) + ext);
  }
});
const upload = multer({ storage, limits: { fileSize: 3*1024*1024 } });

router.post('/register', upload.single('photo'), (req, res) => {
  const { name, email, roll_no, password, contact } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'name, email, password required' });
  const exists = db.prepare('SELECT user_id FROM Users WHERE email=?').get(email);
  if (exists) return res.status(400).json({ error: 'Email already registered' });
  const hash = bcrypt.hashSync(password, 10);
  let photo_path = null;
  if (req.file) photo_path = '/uploads/' + req.file.filename;
  const r = db.prepare('INSERT INTO Users (name,email,roll_no,password_hash,role,contact,photo_path) VALUES (?,?,?,?,?,?,?)')
    .run(name, email, roll_no || '', hash, 'student', contact || '', photo_path);
  const user = { user_id: r.lastInsertRowid, name, email, role: 'student', photo_path };
  const token = jwt.sign(user, SECRET, { expiresIn: '7d' });
  res.json({ token, user });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const u = db.prepare('SELECT * FROM Users WHERE email=?').get(email);
  if (!u) return res.status(401).json({ error: 'Invalid credentials' });
  if (!bcrypt.compareSync(password, u.password_hash)) return res.status(401).json({ error: 'Invalid credentials' });
  if (u.blocked) return res.status(403).json({ error: 'BLOCKED: Your account has been blocked by the admin' + (u.blocked_reason ? ' (' + u.blocked_reason + ')' : '') + '. Contact the admin office.' });
  const user = { user_id: u.user_id, name: u.name, email: u.email, role: u.role, photo_path: u.photo_path };
  const token = jwt.sign(user, SECRET, { expiresIn: '7d' });
  res.json({ token, user });
});

router.get('/me', auth, (req, res) => {
  const u = db.prepare('SELECT user_id,name,email,roll_no,role,contact,photo_path,created_at FROM Users WHERE user_id=?').get(req.user.user_id);
  if (!u) return res.status(401).json({ error: 'Session expired. Please login again.' });
  res.json(u);
});

// Update profile
router.put('/profile', auth, upload.single('photo'), (req, res) => {
  const { name, roll_no, contact, password } = req.body;
  const u = db.prepare('SELECT * FROM Users WHERE user_id=?').get(req.user.user_id);
  if (!u) return res.status(404).json({ error: 'Not found' });
  const newName = name || u.name;
  const newRoll = roll_no !== undefined ? roll_no : u.roll_no;
  const newContact = contact !== undefined ? contact : u.contact;
  let newPhoto = u.photo_path;
  if (req.file) newPhoto = '/uploads/' + req.file.filename;
  let newHash = u.password_hash;
  if (password && password.trim() !== '') newHash = bcrypt.hashSync(password, 10);
  db.prepare('UPDATE Users SET name=?, roll_no=?, contact=?, photo_path=?, password_hash=? WHERE user_id=?')
    .run(newName, newRoll, newContact, newPhoto, newHash, req.user.user_id);
  const user = { user_id: u.user_id, name: newName, email: u.email, role: u.role, photo_path: newPhoto };
  // issue new token with updated name/photo
  const token = jwt.sign(user, SECRET, { expiresIn: '7d' });
  res.json({ token, user });
});

// Diagnostic: shows whether auth headers reach the server (no secrets returned)
router.get('/ping', (req, res) => {
  res.json({ ok: true, hasAuthorization: !!req.headers.authorization, hasXAuthToken: !!req.headers['x-auth-token'] });
});

module.exports = router;
