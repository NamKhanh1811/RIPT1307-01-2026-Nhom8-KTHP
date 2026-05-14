const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
  );

exports.register = async (req, res) => {
  const { email, password, fullName, role } = req.body;
  try {
    // Check duplicate email
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Email đã được sử dụng' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (email, password, full_name, role) VALUES (?, ?, ?, ?)',
      [email, hashed, fullName, role || 'STUDENT'],
    );

    const user = { id: result.insertId, email, fullName, role: role || 'STUDENT' };
    const token = signToken(user);

    // If employer, create company placeholder
    if (role === 'EMPLOYER') {
      await db.query(
        'INSERT INTO companies (user_id, name) VALUES (?, ?)',
        [result.insertId, `${fullName}'s Company`],
      );
    }

    res.status(201).json({ success: true, data: { token, user } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
    }

    const formatted = {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      avatar: user.avatar,
    };
    const token = signToken(formatted);

    res.json({ success: true, data: { token, user: formatted } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, email, full_name as fullName, role, avatar, created_at as createdAt FROM users WHERE id = ?',
      [req.user.id],
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User không tồn tại' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
