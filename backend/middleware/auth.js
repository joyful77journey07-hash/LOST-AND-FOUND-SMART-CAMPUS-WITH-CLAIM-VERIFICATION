const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'lostfound_secret_change_me';

function auth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = req.headers['x-auth-token'] || (h.startsWith('Bearer ') ? h.slice(7) : null);
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    req.user = jwt.verify(token, SECRET);
    const db = require('../db');
    const row = db.prepare('SELECT blocked, blocked_reason FROM Users WHERE user_id=?').get(req.user.user_id);
    if (row && row.blocked) {
      return res.status(403).json({ error: 'BLOCKED: Your account has been blocked by the admin' + (row.blocked_reason ? ' (' + row.blocked_reason + ')' : '') + '.' });
    }
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  next();
}

module.exports = { auth, adminOnly, SECRET };
