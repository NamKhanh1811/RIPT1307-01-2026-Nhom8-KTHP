const db = require('../config/database');

class CvModel {
  static _format(cv) {
    return {
      id:             cv.id,
      userId:         cv.user_id,
      headline:       cv.headline,
      summary:        cv.summary,
      gpa:            cv.gpa,
      university:     cv.university,
      major:          cv.major,
      graduationYear: cv.graduation_year,
      pdfUrl:         cv.pdf_url ?? null,
      updatedAt:      cv.updated_at,
    };
  }

  static async findByUserId(userId) {
    const [rows] = await db.query('SELECT * FROM cv_profiles WHERE user_id = ?', [userId]);
    if (!rows.length) return null;
    const cv = CvModel._format(rows[0]);
    const [skills] = await db.query('SELECT skill_name FROM cv_skills WHERE cv_id = ?', [cv.id]);
    const [experiences] = await db.query(
      'SELECT * FROM experiences WHERE cv_id = ? ORDER BY start_date DESC',
      [cv.id],
    );
    cv.skills = skills.map((s) => s.skill_name);
    cv.experiences = experiences;
    return cv;
  }

  static async upsert(userId, { headline, summary, gpa, university, major, graduationYear, skills, experiences }) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [existing] = await conn.query('SELECT id FROM cv_profiles WHERE user_id = ?', [userId]);
      let cvId;

      if (existing.length > 0) {
        cvId = existing[0].id;
        await conn.query(
          `UPDATE cv_profiles
           SET headline=?, summary=?, gpa=?, university=?, major=?, graduation_year=?
           WHERE id=?`,
          [headline, summary, gpa ?? null, university, major, graduationYear ?? null, cvId],
        );
      } else {
        const [result] = await conn.query(
          `INSERT INTO cv_profiles (user_id, headline, summary, gpa, university, major, graduation_year)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [userId, headline, summary, gpa ?? null, university, major, graduationYear ?? null],
        );
        cvId = result.insertId;
      }

      // Replace skills atomically
      await conn.query('DELETE FROM cv_skills WHERE cv_id = ?', [cvId]);
      if (skills?.length) {
        await conn.query(
          'INSERT INTO cv_skills (cv_id, skill_name) VALUES ?',
          [skills.map((s) => [cvId, s])],
        );
      }

      // Replace experiences atomically
      if (experiences) {
        await conn.query('DELETE FROM experiences WHERE cv_id = ?', [cvId]);
        for (const exp of experiences) {
          await conn.query(
            `INSERT INTO experiences (cv_id, company, position, start_date, end_date, current, description)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [cvId, exp.company, exp.position, exp.startDate ?? null, exp.endDate ?? null, exp.current ? 1 : 0, exp.description],
          );
        }
      }

      await conn.commit();
      return cvId;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  static async updatePdfUrl(userId, url) {
    await db.query('UPDATE cv_profiles SET pdf_url = ? WHERE user_id = ?', [url, userId]);
  }

  // Get just skills array
  static async getSkillsByUserId(userId) {
    const [cvRows] = await db.query('SELECT id FROM cv_profiles WHERE user_id = ?', [userId]);
    if (!cvRows.length) return [];
    const [skills] = await db.query('SELECT skill_name FROM cv_skills WHERE cv_id = ?', [cvRows[0].id]);
    return skills.map((s) => s.skill_name);
  }

  // Aggregate skill popularity across all CV
  static async getHotSkills(limit = 10) {
    const [rows] = await db.query(
      `SELECT skill_name AS skill, COUNT(*) AS count
       FROM cv_skills GROUP BY skill_name
       ORDER BY count DESC LIMIT ?`,
      [limit],
    );
    return rows;
  }
}

module.exports = CvModel;