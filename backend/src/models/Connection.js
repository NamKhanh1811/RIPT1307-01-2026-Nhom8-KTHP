const db = require('../config/database');

// Helper: escape an integer safely for db.query() interpolation
const int = (v, fallback = 0) => parseInt(v, 10) || fallback;
const esc = (v) => db.pool ? db.pool.escape(v) : `'${String(v).replace(/'/g, "''")}'`;

const Connection = {
  async sendRequest(requesterId, receiverId) {
    const [result] = await db.execute(
      `INSERT INTO connections (requester_id, receiver_id, status)
       VALUES (?, ?, 'PENDING')`,
      [requesterId, receiverId]
    );
    return result.insertId;
  },

  async getStatus(userId1, userId2) {
    const [rows] = await db.execute(
      `SELECT * FROM connections
       WHERE (requester_id = ? AND receiver_id = ?)
          OR (requester_id = ? AND receiver_id = ?)
       LIMIT 1`,
      [userId1, userId2, userId2, userId1]
    );
    if (!rows[0]) return null;
    const row = rows[0];
    row.direction = row.requester_id === userId1 ? 'SENT' : 'RECEIVED';
    return row;
  },

  async updateStatus(connectionId, status) {
    const [result] = await db.execute(
      `UPDATE connections SET status = ? WHERE id = ?`,
      [status, connectionId]
    );
    return result.affectedRows > 0;
  },

  async getPendingRequests(userId) {
    const [rows] = await db.execute(
      `SELECT c.id, c.created_at,
              u.id AS user_id, u.full_name, u.avatar, u.role,
              cp.headline
       FROM connections c
       JOIN users u ON u.id = c.requester_id
       LEFT JOIN cv_profiles cp ON cp.user_id = u.id
       WHERE c.receiver_id = ? AND c.status = 'PENDING'
       ORDER BY c.created_at DESC`,
      [userId]
    );
    return rows;
  },

  // Dùng db.query() (không phải prepared statement) vì có ? trong JOIN ON clause
  async getConnections(userId, { page = 1, pageSize = 20, keyword = '' } = {}) {
    const pageInt     = int(page, 1);
    const pageSizeInt = int(pageSize, 20);
    const offset      = (pageInt - 1) * pageSizeInt;
    const uid         = int(userId);
    const like        = `%${keyword.replace(/[%_\\]/g, '\\$&')}%`;

    const [rows] = await db.query(
      `SELECT c.id AS connection_id, c.created_at AS connected_at,
              u.id AS user_id, u.full_name, u.avatar, u.role,
              cp.headline, comp.name AS company_name
       FROM connections c
       JOIN users u ON u.id = IF(c.requester_id = ${uid}, c.receiver_id, c.requester_id)
       LEFT JOIN cv_profiles cp ON cp.user_id = u.id
       LEFT JOIN companies comp ON comp.user_id = u.id
       WHERE (c.requester_id = ${uid} OR c.receiver_id = ${uid})
         AND c.status = 'ACCEPTED'
         AND u.full_name LIKE ?
       ORDER BY c.updated_at DESC
       LIMIT ${pageSizeInt} OFFSET ${offset}`,
      [like]
    );

    const [[{ total }]] = await db.execute(
      `SELECT COUNT(*) AS total FROM connections
       WHERE (requester_id = ? OR receiver_id = ?) AND status = 'ACCEPTED'`,
      [uid, uid]
    );
    return { data: rows, total };
  },

  async getSuggestions(userId, limit = 10) {
    const uid      = int(userId);
    const limitInt = int(limit, 10);

    // Dùng db.query() vì có ? trong subquery JOIN ON
    const [rows] = await db.query(
      `SELECT u.id, u.full_name, u.avatar, u.role,
              cp.headline, comp.name AS company_name,
              COALESCE((
                SELECT COUNT(*)
                FROM connections c1
                JOIN connections c2
                  ON c2.status = 'ACCEPTED'
                 AND (c2.requester_id = ${uid} OR c2.receiver_id = ${uid})
                 AND (
                   (c1.requester_id = u.id AND c1.receiver_id = IF(c2.requester_id = ${uid}, c2.receiver_id, c2.requester_id))
                   OR
                   (c1.receiver_id  = u.id AND c1.requester_id = IF(c2.requester_id = ${uid}, c2.receiver_id, c2.requester_id))
                 )
                WHERE c1.status = 'ACCEPTED'
              ), 0) AS mutual_count
       FROM users u
       LEFT JOIN cv_profiles cp ON cp.user_id = u.id
       LEFT JOIN companies comp ON comp.user_id = u.id
       WHERE u.id <> ${uid}
         AND u.role <> 'ADMIN'
         AND u.id NOT IN (
           SELECT IF(requester_id = ${uid}, receiver_id, requester_id)
           FROM connections
           WHERE (requester_id = ${uid} OR receiver_id = ${uid})
         )
       ORDER BY mutual_count DESC, u.created_at DESC
       LIMIT ${limitInt}`
    );
    return rows;
  },

  async remove(connectionId) {
    const [result] = await db.execute(
      `DELETE FROM connections WHERE id = ?`,
      [connectionId]
    );
    return result.affectedRows > 0;
  },

  // Lấy thông tin profile chi tiết của 1 user (dùng cho drawer xem profile)
  async getUserProfile(targetUserId, currentUserId) {
    const [[user]] = await db.execute(
      `SELECT u.id, u.full_name, u.avatar, u.email, u.role, u.created_at,
              cp.headline, cp.summary, cp.university, cp.major, cp.graduation_year, cp.gpa,
              comp.name AS company_name, comp.industry, comp.description AS company_description
       FROM users u
       LEFT JOIN cv_profiles cp ON cp.user_id = u.id
       LEFT JOIN companies comp ON comp.user_id = u.id
       WHERE u.id = ? AND u.role <> 'ADMIN'`,
      [targetUserId]
    );
    if (!user) return null;

    // Lấy skills từ bảng cv_skills
    const [skillRows] = await db.execute(
      `SELECT cs.skill_name FROM cv_skills cs
       JOIN cv_profiles cp ON cp.id = cs.cv_id
       WHERE cp.user_id = ?`,
      [targetUserId]
    );
    user.skills = skillRows.map(r => r.skill_name);

    // Lấy kinh nghiệm từ bảng experiences
    const [expRows] = await db.execute(
      `SELECT e.company, e.position, e.start_date, e.end_date, e.current, e.description
       FROM experiences e
       JOIN cv_profiles cp ON cp.id = e.cv_id
       WHERE cp.user_id = ?
       ORDER BY e.start_date DESC`,
      [targetUserId]
    );
    user.experiences = expRows;

    const status = await this.getStatus(currentUserId, targetUserId);
    user.connection_status = status?.status || null;
    user.connection_id = status?.id || null;
    user.direction = status?.direction || null;

    // Số kết nối của người đó
    const [[{ total }]] = await db.execute(
      `SELECT COUNT(*) AS total FROM connections
       WHERE (requester_id = ? OR receiver_id = ?) AND status = 'ACCEPTED'`,
      [targetUserId, targetUserId]
    );
    user.connection_count = total;

    return user;
  },

  async getUsersWithConnectionStatus(currentUserId, { page = 1, pageSize = 20, keyword = '', role = '' } = {}) {
    const pageInt     = int(page, 1);
    const pageSizeInt = int(pageSize, 20);
    const offset      = (pageInt - 1) * pageSizeInt;
    const uid         = int(currentUserId);
    const like        = `%${keyword.replace(/[%_\\]/g, '\\$&')}%`;
    const roleFilter  = role ? `AND u.role = ${db.escape(role)}` : '';

    // Dùng db.query() vì có ? trong LEFT JOIN ON clause
    const [rows] = await db.query(
      `SELECT u.id, u.full_name, u.avatar, u.role,
              cp.headline, comp.name AS company_name,
              c.id           AS connection_id,
              c.status       AS connection_status,
              c.requester_id AS connection_requester_id
       FROM users u
       LEFT JOIN cv_profiles cp ON cp.user_id = u.id
       LEFT JOIN companies comp ON comp.user_id = u.id
       LEFT JOIN connections c ON (
         (c.requester_id = ${uid} AND c.receiver_id = u.id) OR
         (c.receiver_id  = ${uid} AND c.requester_id = u.id)
       )
       WHERE u.id <> ${uid} AND u.role <> 'ADMIN'
         AND u.full_name LIKE ?
         ${roleFilter}
       ORDER BY c.status DESC, u.full_name
       LIMIT ${pageSizeInt} OFFSET ${offset}`,
      [like]
    );

    // Tính direction trong JS — không dùng CASE WHEN ? trong SQL
    return rows.map(row => {
      const { connection_requester_id, ...rest } = row;
      return {
        ...rest,
        direction: connection_requester_id == null
          ? null
          : connection_requester_id === uid
            ? 'SENT'
            : 'RECEIVED',
      };
    });
  },
};

module.exports = Connection;