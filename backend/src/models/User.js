const db = require('../config/database');
const bcrypt = require('bcryptjs');

class UserModel {
  static async findById(id) {
    const [rows] = await db.query(
      'SELECT id, email, full_name AS fullName, role, avatar, created_at AS createdAt FROM users WHERE id = ?',
      [id],
    );
    return rows[0] ?? null;
  }

  static async findByEmail(email) {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0] ?? null;
  }

  static async create({ email, password, fullName, role }) {
    const hash = await bcrypt.hash(password, 12);
    const [result] = await db.query(
      'INSERT INTO users (email, password, full_name, role) VALUES (?, ?, ?, ?)',
      [email, hash, fullName, role || 'STUDENT'],
    );
    return result.insertId;
  }

  static async verifyPassword(plainText, hash) {
    return bcrypt.compare(plainText, hash);
  }

  static async findAll({ search, role, page = 1, pageSize = 20 } = {}) {
    let sql = 'SELECT id, email, full_name AS fullName, role, avatar, created_at AS createdAt FROM users WHERE 1=1';
    const params = [];
    if (search) { sql += ' AND (full_name LIKE ? OR email LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    if (role)   { sql += ' AND role = ?'; params.push(role); }
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));
    const [rows] = await db.query(sql, params);
    return rows;
  }

  static async countAll() {
    const [[{ count }]] = await db.query('SELECT COUNT(*) AS count FROM users');
    return count;
  }

  static async updateAvatar(id, avatarUrl) {
    await db.query('UPDATE users SET avatar = ? WHERE id = ?', [avatarUrl, id]);
  }

  static async delete(id) {
    await db.query('DELETE FROM users WHERE id = ? AND role != "ADMIN"', [id]);
  }
}

module.exports = UserModel;
