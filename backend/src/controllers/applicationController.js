const db = require('../config/database');
const { calcMatchScore } = require('../services/matching');
const emailService = require('../services/email');

// POST /api/applications (Student apply)
exports.apply = async (req, res) => {
  const { jobId } = req.body;
  const userId = req.user.id;
  try {
    // Check already applied
    const [existing] = await db.query(
      'SELECT id FROM applications WHERE user_id = ? AND job_id = ?',
      [userId, jobId],
    );
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Bạn đã ứng tuyển vị trí này rồi' });
    }

    // Get CV skills
    const [cvRows] = await db.query(
      `SELECT cv.id FROM cv_profiles cv WHERE cv.user_id = ?`, [userId],
    );
    let matchScore = 0;
    if (cvRows.length > 0) {
      const cvId = cvRows[0].id;
      const [cvSkillRows] = await db.query('SELECT skill_name FROM cv_skills WHERE cv_id = ?', [cvId]);
      const [jobSkillRows] = await db.query('SELECT skill_name FROM job_skills WHERE job_id = ?', [jobId]);
      const cvSkills = cvSkillRows.map((s) => s.skill_name);
      const jobSkills = jobSkillRows.map((s) => s.skill_name);
      matchScore = calcMatchScore(cvSkills, jobSkills);
    }

    // Insert application
    const [result] = await db.query(
      'INSERT INTO applications (user_id, job_id, match_score) VALUES (?, ?, ?)',
      [userId, jobId, matchScore],
    );

    // Send confirmation email (async, don't await)
    const [userRows] = await db.query('SELECT full_name, email FROM users WHERE id = ?', [userId]);
    const [jobRows] = await db.query(
      'SELECT j.title, c.name as companyName FROM jobs j JOIN companies c ON j.company_id = c.id WHERE j.id = ?',
      [jobId],
    );
    if (userRows.length && jobRows.length) {
      emailService.sendApplyConfirmation(
        userRows[0].email,
        userRows[0].full_name,
        jobRows[0].title,
        jobRows[0].companyName,
      );
    }

    res.status(201).json({
      success: true,
      data: { id: result.insertId, jobId, userId, matchScore, status: 'PENDING' },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/applications/my (Student)
exports.getMyApplications = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT a.*, j.title as jobTitle, j.type as jobType,
              c.name as companyName
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       JOIN companies c ON j.company_id = c.id
       WHERE a.user_id = ?
       ORDER BY a.applied_at DESC`,
      [req.user.id],
    );
    const apps = rows.map((r) => ({
      ...r,
      job: { title: r.jobTitle, type: r.jobType, company: { name: r.companyName } },
    }));
    res.json({ success: true, data: apps });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/applications/job/:jobId (Employer — ranked by matchScore)
exports.getApplicationsByJob = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT a.*, u.full_name as userName, u.email as userEmail
       FROM applications a
       JOIN users u ON a.user_id = u.id
       WHERE a.job_id = ?
       ORDER BY a.match_score DESC`,
      [req.params.jobId],
    );

    // Attach CV skills for each candidate
    for (const row of rows) {
      const [cvRows] = await db.query('SELECT id FROM cv_profiles WHERE user_id = ?', [row.user_id]);
      if (cvRows.length) {
        const [skills] = await db.query('SELECT skill_name FROM cv_skills WHERE cv_id = ?', [cvRows[0].id]);
        row.cvProfile = { skills: skills.map((s) => s.skill_name) };
      }
      row.user = { fullName: row.userName, email: row.userEmail };
    }

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/applications/:id/status (Employer)
exports.updateStatus = async (req, res) => {
  const { status, note } = req.body;
  const { id } = req.params;
  try {
    await db.query(
      'UPDATE applications SET status = ?, employer_note = ? WHERE id = ?',
      [status, note, id],
    );

    // Send email to student
    const [rows] = await db.query(
      `SELECT u.email, u.full_name, j.title, c.name as companyName
       FROM applications a
       JOIN users u ON a.user_id = u.id
       JOIN jobs j ON a.job_id = j.id
       JOIN companies c ON j.company_id = c.id
       WHERE a.id = ?`,
      [id],
    );
    if (rows.length) {
      const { email, full_name, title, companyName } = rows[0];
      if (status === 'APPROVED') {
        emailService.sendApplicationApproved(email, full_name, title, companyName, note);
      } else if (status === 'REJECTED') {
        emailService.sendApplicationRejected(email, full_name, title, companyName, note);
      }
    }

    res.json({ success: true, message: 'Cập nhật trạng thái thành công' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
