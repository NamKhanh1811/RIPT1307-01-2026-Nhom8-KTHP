const db = require('../config/database');

const int = (v, fallback = 0) => parseInt(v, 10) || fallback;

const Message = {
  async getOrCreateConversation(userA, userB) {
    const [u1, u2] = userA < userB ? [userA, userB] : [userB, userA];
    const [existing] = await db.execute(
      `SELECT * FROM conversations WHERE user1_id = ? AND user2_id = ?`,
      [u1, u2]
    );
    if (existing.length) return existing[0];

    const [result] = await db.execute(
      `INSERT INTO conversations (user1_id, user2_id) VALUES (?, ?)`,
      [u1, u2]
    );
    return { id: result.insertId, user1_id: u1, user2_id: u2 };
  },

  async getConversations(userId) {
    const uid = int(userId);
    // Dùng db.query() vì CASE WHEN trong JOIN ON không hợp lệ với prepared statement
    // Thay CASE WHEN bằng IF() và interpolate uid trực tiếp
    const [rows] = await db.query(
      `SELECT
         conv.id, conv.last_message, conv.last_message_at,
         u.id   AS partner_id,
         u.full_name AS partner_name,
         u.avatar    AS partner_avatar,
         u.role      AS partner_role,
         (SELECT COUNT(*) FROM messages m
          WHERE m.conversation_id = conv.id
            AND m.sender_id <> ${uid}
            AND m.is_read = FALSE) AS unread_count
       FROM conversations conv
       JOIN users u ON u.id = IF(conv.user1_id = ${uid}, conv.user2_id, conv.user1_id)
       WHERE conv.user1_id = ${uid} OR conv.user2_id = ${uid}
       ORDER BY COALESCE(conv.last_message_at, conv.created_at) DESC`
    );
    return rows;
  },

  async getMessages(conversationId, { page = 1, pageSize = 50 } = {}) {
    const pageInt     = int(page, 1);
    const pageSizeInt = int(pageSize, 50);
    const offset      = (pageInt - 1) * pageSizeInt;
    const convId      = int(conversationId);

    // Dùng db.query() với interpolation cho LIMIT/OFFSET để chắc chắn không crash
    const [rows] = await db.query(
      `SELECT m.id, m.sender_id, m.content, m.is_read, m.created_at,
              u.full_name AS sender_name, u.avatar AS sender_avatar
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.conversation_id = ${convId}
       ORDER BY m.created_at DESC
       LIMIT ${pageSizeInt} OFFSET ${offset}`
    );
    return rows.reverse();
  },

  async send(conversationId, senderId, content) {
    const [result] = await db.execute(
      `INSERT INTO messages (conversation_id, sender_id, content) VALUES (?, ?, ?)`,
      [conversationId, senderId, content]
    );

    await db.execute(
      `UPDATE conversations
       SET last_message = ?, last_message_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [content.slice(0, 200), conversationId]
    );

    const [[msg]] = await db.execute(
      `SELECT m.*, u.full_name AS sender_name, u.avatar AS sender_avatar
       FROM messages m JOIN users u ON u.id = m.sender_id
       WHERE m.id = ?`,
      [result.insertId]
    );
    return msg;
  },

  async markAllRead(conversationId, userId) {
    await db.execute(
      `UPDATE messages SET is_read = TRUE
       WHERE conversation_id = ? AND sender_id <> ? AND is_read = FALSE`,
      [conversationId, userId]
    );
  },

  async isMember(conversationId, userId) {
    const [[conv]] = await db.execute(
      `SELECT id FROM conversations WHERE id = ? AND (user1_id = ? OR user2_id = ?)`,
      [conversationId, userId, userId]
    );
    return !!conv;
  },

  async getTotalUnread(userId) {
    const [[row]] = await db.execute(
      `SELECT COUNT(*) AS total
       FROM messages m
       JOIN conversations c ON c.id = m.conversation_id
       WHERE (c.user1_id = ? OR c.user2_id = ?)
         AND m.sender_id <> ?
         AND m.is_read = FALSE`,
      [userId, userId, userId]
    );
    return row.total;
  },

  // Lấy 1 tin nhắn theo id (dùng để kiểm tra quyền)
  async findById(messageId) {
    const [[msg]] = await db.execute(
      `SELECT m.*, u.full_name AS sender_name, u.avatar AS sender_avatar
       FROM messages m JOIN users u ON u.id = m.sender_id
       WHERE m.id = ?`,
      [messageId]
    );
    return msg || null;
  },

  // Chỉnh sửa nội dung tin nhắn (chỉ người gửi mới được sửa)
  async update(messageId, senderId, content) {
    const [result] = await db.execute(
      `UPDATE messages SET content = ?, is_edited = TRUE WHERE id = ? AND sender_id = ?`,
      [content, messageId, senderId]
    );
    if (!result.affectedRows) return null;
    return this.findById(messageId);
  },

  // Xoá tin nhắn (chỉ người gửi mới được xoá — soft delete bằng cờ)
  async delete(messageId, senderId) {
    const [result] = await db.execute(
      `UPDATE messages SET is_deleted = TRUE, content = '' WHERE id = ? AND sender_id = ?`,
      [messageId, senderId]
    );
    return result.affectedRows > 0;
  },
};

module.exports = Message;