// Resets the admin password to admin123 without touching any other data.
const db = require('./db');
const bcrypt = require('bcryptjs');
db.prepare("UPDATE Users SET password_hash=?, email='admin@campus.edu' WHERE role='admin'").run(bcrypt.hashSync('admin123', 10));
console.log('Admin password reset: admin@campus.edu / admin123');
