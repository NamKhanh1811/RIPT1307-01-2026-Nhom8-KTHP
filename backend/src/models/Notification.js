const db = require('../config/database');

class NotificationModel {
  static async create(userId, type, title, message) {
    const [result] = await db.query(
      'INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)',
      [userId, type, title, message],
    );
    return result.insertId;
  }

  static async findByUser(userId, limit = 20) {
    const [rows] = await db.query(
      `SELECT * FROM notifications WHERE user_id = ?
       ORDER BY created_at DESC LIMIT ?`,
      [userId, limit],
    );
    return rows;
  }

  static async countUnread(userId) {
    const [[{ count }]] = await db.query(
      'SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0',
      [userId],
    );
    return count;
  }

  static async markRead(id, userId) {
    await db.query('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [id, userId]);
  }

  static async markAllRead(userId) {
    await db.query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [userId]);
  }
}

module.exports = NotificationModel;
