const db = require('../config/database');

// Helper: get job with skills and company
async function getJobWithDetails(id) {
  const [jobs] = await db.query(
    `SELECT j.*, c.name as companyName, c.logo as companyLogo, c.industry as companyIndustry
     FROM jobs j LEFT JOIN companies c ON j.company_id = c.id
     WHERE j.id = ?`,
    [id],
  );
  if (!jobs.length) return null;
  const job = jobs[0];

  const [skills] = await db.query('SELECT skill_name FROM job_skills WHERE job_id = ?', [id]);
  job.skills = skills.map((s) => s.skill_name);
  job.company = { name: job.companyName, logo: job.companyLogo };
  return job;
}

// GET /api/jobs
exports.getJobs = async (req, res) => {
  const { keyword, industry, type, remote, page = 1, pageSize = 20 } = req.query;
  try {
    let sql = `SELECT j.id, j.title, j.industry, j.type, j.location, j.remote,
                      j.salary_min, j.salary_max, j.deadline, j.status, j.created_at,
                      c.name as companyName, c.logo as companyLogo
               FROM jobs j LEFT JOIN companies c ON j.company_id = c.id
               WHERE j.status = 'APPROVED'`;
    const params = [];

    if (keyword) { sql += ' AND (j.title LIKE ? OR c.name LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`); }
    if (industry) { sql += ' AND j.industry = ?'; params.push(industry); }
    if (type) { sql += ' AND j.type = ?'; params.push(type); }
    if (remote !== undefined) { sql += ' AND j.remote = ?'; params.push(remote === 'true'); }

    const offset = (Number(page) - 1) * Number(pageSize);
    sql += ` ORDER BY j.created_at DESC LIMIT ${Number(pageSize)} OFFSET ${offset}`;

    const [jobs] = await db.query(sql, params);

    // Attach skills
    for (const job of jobs) {
      const [skills] = await db.query('SELECT skill_name FROM job_skills WHERE job_id = ?', [job.id]);
      job.skills = skills.map((s) => s.skill_name);
      job.company = { name: job.companyName, logo: job.companyLogo };
    }

    res.json({ success: true, data: jobs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/jobs/:id
exports.getJobById = async (req, res) => {
  try {
    const job = await getJobWithDetails(Number(req.params.id));
    if (!job) return res.status(404).json({ success: false, message: 'Không tìm thấy job' });
    res.json({ success: true, data: job });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/jobs (Employer only)
exports.createJob = async (req, res) => {
  const { title, description, requirements, industry, type, salaryMin, salaryMax,
    location, remote, skills, deadline } = req.body;
  try {
    const [companies] = await db.query('SELECT id FROM companies WHERE user_id = ?', [req.user.id]);
    if (!companies.length) {
      return res.status(403).json({ success: false, message: 'Không tìm thấy thông tin công ty' });
    }

    const [result] = await db.query(
      `INSERT INTO jobs (company_id, title, description, requirements, industry, type,
        salary_min, salary_max, location, remote, deadline)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [companies[0].id, title, description, requirements, industry, type,
       salaryMin, salaryMax, location, remote || false, deadline],
    );

    const jobId = result.insertId;
    if (skills?.length) {
      await db.query(
        'INSERT INTO job_skills (job_id, skill_name) VALUES ?',
        [skills.map((s) => [jobId, s])],
      );
    }

    const job = await getJobWithDetails(jobId);
    res.status(201).json({ success: true, data: job });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/jobs/my (Employer)
exports.getMyJobs = async (req, res) => {
  try {
    const [companies] = await db.query('SELECT id FROM companies WHERE user_id = ?', [req.user.id]);
    if (!companies.length) return res.json({ success: true, data: [] });

    const [jobs] = await db.query(
      'SELECT * FROM jobs WHERE company_id = ? ORDER BY created_at DESC',
      [companies[0].id],
    );
    for (const job of jobs) {
      const [skills] = await db.query('SELECT skill_name FROM job_skills WHERE job_id = ?', [job.id]);
      job.skills = skills.map((s) => s.skill_name);
    }
    res.json({ success: true, data: jobs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/admin/jobs/:id/approve (Admin)
exports.approveJob = async (req, res) => {
  try {
    await db.query('UPDATE jobs SET status = ? WHERE id = ?', ['APPROVED', req.params.id]);
    res.json({ success: true, message: 'Job đã được duyệt' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/admin/jobs/:id/reject (Admin)
exports.rejectJob = async (req, res) => {
  try {
    await db.query('UPDATE jobs SET status = ? WHERE id = ?', ['REJECTED', req.params.id]);
    res.json({ success: true, message: 'Job đã bị từ chối' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
