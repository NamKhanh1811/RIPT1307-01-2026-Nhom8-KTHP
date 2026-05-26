const db = require('../config/database');

class JobModel {
  static async findById(id) {
    const [rows] = await db.query(
      `SELECT j.*, c.name AS companyName, c.logo AS companyLogo,
              c.industry AS companyIndustry, c.description AS companyDesc
       FROM jobs j LEFT JOIN companies c ON j.company_id = c.id
       WHERE j.id = ?`,
      [id],
    );
    if (!rows.length) return null;
    const job = rows[0];
    const [skills] = await db.query('SELECT skill_name FROM job_skills WHERE job_id = ?', [id]);
    job.skills = skills.map((s) => s.skill_name);
    job.company = { name: job.companyName, logo: job.companyLogo, description: job.companyDesc };
    return job;
  }

  static async findAll({ keyword, industry, type, remote, status = 'APPROVED', page = 1, pageSize = 20 } = {}) {
    let sql = `SELECT j.id, j.title, j.industry, j.type, j.location, j.remote,
                      j.salary_min, j.salary_max, j.deadline, j.status, j.created_at,
                      c.name AS companyName, c.logo AS companyLogo
               FROM jobs j LEFT JOIN companies c ON j.company_id = c.id
               WHERE j.status = ?`;
    const params = [status];

    if (keyword) { sql += ' AND (j.title LIKE ? OR c.name LIKE ? OR j.description LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`); }
    if (industry) { sql += ' AND j.industry = ?'; params.push(industry); }
    if (type)     { sql += ' AND j.type = ?'; params.push(type); }
    if (remote !== undefined && remote !== '') { sql += ' AND j.remote = ?'; params.push(remote === 'true' || remote === true ? 1 : 0); }

    // Count total before pagination
    const countSql = sql.replace(/SELECT .* FROM/, 'SELECT COUNT(*) AS total FROM').split('ORDER BY')[0];
    const [[{ total }]] = await db.query(countSql, params);

    sql += ' ORDER BY j.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));

    const [jobs] = await db.query(sql, params);
    for (const job of jobs) {
      const [skills] = await db.query('SELECT skill_name FROM job_skills WHERE job_id = ?', [job.id]);
      job.skills = skills.map((s) => s.skill_name);
      job.company = { name: job.companyName, logo: job.companyLogo };
    }
    return { jobs, total };
  }

  static async findByCompany(companyId) {
    const [jobs] = await db.query(
      'SELECT * FROM jobs WHERE company_id = ? ORDER BY created_at DESC',
      [companyId],
    );
    for (const job of jobs) {
      const [skills] = await db.query('SELECT skill_name FROM job_skills WHERE job_id = ?', [job.id]);
      job.skills = skills.map((s) => s.skill_name);
    }
    return jobs;
  }

  static async create({ companyId, title, description, requirements, industry, type,
    salaryMin, salaryMax, location, remote, skills, deadline }) {
    const [result] = await db.query(
      `INSERT INTO jobs (company_id, title, description, requirements, industry, type,
        salary_min, salary_max, location, remote, deadline)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [companyId, title, description, requirements, industry, type,
       salaryMin ?? null, salaryMax ?? null, location, remote ? 1 : 0, deadline],
    );
    const jobId = result.insertId;
    if (skills?.length) {
      await db.query('INSERT INTO job_skills (job_id, skill_name) VALUES ?', [skills.map((s) => [jobId, s])]);
    }
    return jobId;
  }

  static async update(id, data) {
    const { title, description, requirements, industry, type,
      salaryMin, salaryMax, location, remote, skills, deadline } = data;
    await db.query(
      `UPDATE jobs SET title=?, description=?, requirements=?, industry=?, type=?,
        salary_min=?, salary_max=?, location=?, remote=?, deadline=? WHERE id=?`,
      [title, description, requirements, industry, type, salaryMin, salaryMax, location, remote ? 1 : 0, deadline, id],
    );
    if (skills) {
      await db.query('DELETE FROM job_skills WHERE job_id = ?', [id]);
      if (skills.length) {
        await db.query('INSERT INTO job_skills (job_id, skill_name) VALUES ?', [skills.map((s) => [id, s])]);
      }
    }
  }

  static async updateStatus(id, status) {
    await db.query('UPDATE jobs SET status = ? WHERE id = ?', [status, id]);
  }

  static async delete(id) {
    await db.query('DELETE FROM jobs WHERE id = ?', [id]);
  }

  static async findAllAdmin() {
    const [jobs] = await db.query(
      `SELECT j.*, c.name AS companyName FROM jobs j
       LEFT JOIN companies c ON j.company_id = c.id
       ORDER BY j.created_at DESC`,
    );
    for (const job of jobs) {
      const [skills] = await db.query('SELECT skill_name FROM job_skills WHERE job_id = ?', [job.id]);
      job.skills = skills.map((s) => s.skill_name);
      job.company = { name: job.companyName };
    }
    return jobs;
  }
}

module.exports = JobModel;
