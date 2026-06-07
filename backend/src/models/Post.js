const db = require('../config/database');

class PostModel {
  static async create(userId, content, imageUrl = null) {
    const [result] = await db.query(
      'INSERT INTO posts (user_id, content, image_url) VALUES (?, ?, ?)',
      [userId, content, imageUrl],
    );
    return result.insertId;
  }

  static async findAll(limit = 20, offset = 0, currentUserId = null) {
    const [rows] = await db.query(
      `SELECT p.*, 
        u.full_name, u.email, u.role, u.avatar,
        COUNT(DISTINCT l.id) AS likes_count,
        COUNT(DISTINCT c.id) AS comments_count,
        MAX(CASE WHEN l.user_id = ? THEN 1 ELSE 0 END) AS is_liked
       FROM posts p
       JOIN users u ON p.user_id = u.id
       LEFT JOIN post_likes l ON p.id = l.post_id
       LEFT JOIN post_comments c ON p.id = c.post_id
       GROUP BY p.id, u.full_name, u.email, u.role, u.avatar
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [currentUserId || 0, limit, offset],
    );
    return rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      content: r.content,
      imageUrl: r.image_url,
      likesCount: r.likes_count,
      commentsCount: r.comments_count,
      isLiked: r.is_liked === 1,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      user: { id: r.user_id, fullName: r.full_name, email: r.email, role: r.role, avatar: r.avatar },
    }));
  }

  static async findById(id) {
    const [[row]] = await db.query('SELECT * FROM posts WHERE id = ?', [id]);
    return row;
  }

  static async delete(id, userId) {
    const [result] = await db.query(
      'DELETE FROM posts WHERE id = ? AND user_id = ?', [id, userId],
    );
    return result.affectedRows > 0;
  }

  // Like / Unlike
  static async toggleLike(postId, userId) {
    const [[existing]] = await db.query(
      'SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?', [postId, userId],
    );
    if (existing) {
      await db.query('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?', [postId, userId]);
    } else {
      await db.query('INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)', [postId, userId]);
    }
    const [[{ count }]] = await db.query(
      'SELECT COUNT(*) AS count FROM post_likes WHERE post_id = ?', [postId],
    );
    return { liked: !existing, likesCount: count };
  }

  // Comments
  static async getComments(postId) {
    const [rows] = await db.query(
      `SELECT c.*, u.full_name, u.role, u.avatar
       FROM post_comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.post_id = ?
       ORDER BY c.created_at ASC`,
      [postId],
    );
    return rows.map((r) => ({
      id: r.id,
      postId: r.post_id,
      userId: r.user_id,
      content: r.content,
      createdAt: r.created_at,
      user: { id: r.user_id, fullName: r.full_name, role: r.role, avatar: r.avatar },
    }));
  }

  static async addComment(postId, userId, content) {
    const [result] = await db.query(
      'INSERT INTO post_comments (post_id, user_id, content) VALUES (?, ?, ?)',
      [postId, userId, content],
    );
    const [[user]] = await db.query('SELECT full_name, role, avatar FROM users WHERE id = ?', [userId]);
    return {
      id: result.insertId,
      postId,
      userId,
      content,
      createdAt: new Date().toISOString(),
      user: { id: userId, fullName: user.full_name, role: user.role, avatar: user.avatar },
    };
  }

  static async deleteComment(commentId, userId) {
    const [result] = await db.query(
      'DELETE FROM post_comments WHERE id = ? AND user_id = ?', [commentId, userId],
    );
    return result.affectedRows > 0;
  }
}

module.exports = PostModel;