const db = require('../config/database');

class ApplicationModel {
  static async findById(id) {
    const [rows] = await db.query('SELECT * FROM applications WHERE id = ?', [id]);
    return rows[0] ?? null;
  }

  static async existsByUserAndJob(userId, jobId) {
    const [rows] = await db.query(
      'SELECT id FROM applications WHERE user_id = ? AND job_id = ?',
      [userId, jobId],
    );
    return rows.length > 0;
  }

  static async create({ userId, jobId, matchScore }) {
    const [result] = await db.query(
      'INSERT INTO applications (user_id, job_id, match_score) VALUES (?, ?, ?)',
      [userId, jobId, matchScore],
    );
    return result.insertId;
  }

  static async updateStatus(id, status, note) {
    await db.query(
      'UPDATE applications SET status = ?, employer_note = ? WHERE id = ?',
      [status, note ?? null, id],
    );
  }

  static async findByUser(userId) {
    const [rows] = await db.query(
      `SELECT a.*,
              j.title AS jobTitle, j.type AS jobType, j.location AS jobLocation,
              c.name AS companyName, c.logo AS companyLogo
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       JOIN companies c ON j.company_id = c.id
       WHERE a.user_id = ?
       ORDER BY a.applied_at DESC`,
      [userId],
    );
    return rows.map((r) => ({
      ...r,
      appliedAt: r.applied_at,
      createdAt: r.applied_at,
      job: { id: r.job_id, title: r.jobTitle, type: r.jobType, location: r.jobLocation,
             company: { name: r.companyName, logo: r.companyLogo } },
    }));
  }

  static async findByJob(jobId) {
    const [rows] = await db.query(
      `SELECT a.*,
              u.full_name AS userName, u.email AS userEmail, u.avatar AS userAvatar,
              cp.id AS cvId, cp.headline AS cvHeadline, cp.summary AS cvSummary,
              cp.gpa AS cvGpa, cp.university AS cvUniversity, cp.major AS cvMajor,
              cp.graduation_year AS cvGraduationYear, cp.pdf_url AS cvPdfUrl
       FROM applications a
       JOIN users u ON a.user_id = u.id
       LEFT JOIN cv_profiles cp ON cp.user_id = a.user_id
       WHERE a.job_id = ?
       ORDER BY a.match_score DESC, a.applied_at ASC`,
      [jobId],
    );
    for (const row of rows) {
      const skills = [];
      if (row.cvId) {
        const [skillRows] = await db.query('SELECT skill_name FROM cv_skills WHERE cv_id = ?', [row.cvId]);
        skills.push(...skillRows.map((s) => s.skill_name));
      }
      row.cvProfile = {
        id:             row.cvId,
        headline:       row.cvHeadline,
        summary:        row.cvSummary,
        gpa:            row.cvGpa,
        university:     row.cvUniversity,
        major:          row.cvMajor,
        graduationYear: row.cvGraduationYear,
        pdfUrl:         row.cvPdfUrl ?? null,
        skills,
      };
      row.user = { id: row.user_id, fullName: row.userName, email: row.userEmail, avatar: row.userAvatar };
      row.createdAt = row.applied_at;
    }
    return rows;
  }

  static async findWithDetail(id) {
    const [rows] = await db.query(
      `SELECT a.*,
              u.full_name AS userName, u.email AS userEmail,
              j.title AS jobTitle,
              c.name AS companyName
       FROM applications a
       JOIN users u ON a.user_id = u.id
       JOIN jobs j ON a.job_id = j.id
       JOIN companies c ON j.company_id = c.id
       WHERE a.id = ?`,
      [id],
    );
    return rows[0] ?? null;
  }

  static async findAll() {
    const [rows] = await db.query(
      `SELECT a.*, u.full_name AS userName, j.title AS jobTitle
       FROM applications a
       JOIN users u ON a.user_id = u.id
       JOIN jobs j ON a.job_id = j.id
       ORDER BY a.applied_at DESC`,
    );
    return rows;
  }

  static async getStatusCounts() {
    const [rows] = await db.query(
      "SELECT status, COUNT(*) AS count FROM applications GROUP BY status",
    );
    return rows;
  }

  static async getMonthlyTrend(months = 6) {
    const [rows] = await db.query(
      `SELECT DATE_FORMAT(applied_at, '%m/%Y') AS month, COUNT(*) AS count
       FROM applications
       WHERE applied_at >= DATE_SUB(NOW(), INTERVAL ? MONTH)
       GROUP BY DATE_FORMAT(applied_at, '%Y-%m')
       ORDER BY MIN(applied_at) ASC`,
      [months],
    );
    return rows;
  }
}

module.exports = ApplicationModel;