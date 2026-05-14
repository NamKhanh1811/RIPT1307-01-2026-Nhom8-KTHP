const express = require('express');
const multer = require('multer');
const path = require('path');
const authController = require('../controllers/authController');
const jobController = require('../controllers/jobController');
const applicationController = require('../controllers/applicationController');
const { authenticate, authorize } = require('../middlewares/auth');

const router = express.Router();

// Multer config for CV PDF upload
const storage = multer.diskStorage({
  destination: 'uploads/cv/',
  filename: (req, file, cb) => {
    cb(null, `${req.user.id}_${Date.now()}${path.extname(file.originalname)}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Chỉ chấp nhận file PDF'));
  },
});

// =================== AUTH ===================
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/me', authenticate, authController.getMe);

// =================== JOBS ===================
router.get('/jobs', jobController.getJobs);
router.get('/jobs/my', authenticate, authorize('EMPLOYER'), jobController.getMyJobs);
router.get('/jobs/:id', jobController.getJobById);
router.post('/jobs', authenticate, authorize('EMPLOYER'), jobController.createJob);

// =================== APPLICATIONS ===================
router.post('/applications', authenticate, authorize('STUDENT'), applicationController.apply);
router.get('/applications/my', authenticate, authorize('STUDENT'), applicationController.getMyApplications);
router.get('/applications/job/:jobId', authenticate, authorize('EMPLOYER'), applicationController.getApplicationsByJob);
router.patch('/applications/:id/status', authenticate, authorize('EMPLOYER'), applicationController.updateStatus);

// =================== CV ===================
const db = require('../config/database');

router.get('/cv/my', authenticate, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM cv_profiles WHERE user_id = ?', [req.user.id]);
    if (!rows.length) return res.json({ success: true, data: null });

    const cv = rows[0];
    const [skills] = await db.query('SELECT skill_name FROM cv_skills WHERE cv_id = ?', [cv.id]);
    const [experiences] = await db.query('SELECT * FROM experiences WHERE cv_id = ?', [cv.id]);
    cv.skills = skills.map((s) => s.skill_name);
    cv.experiences = experiences;

    res.json({ success: true, data: cv });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/cv', authenticate, authorize('STUDENT'), async (req, res) => {
  const { headline, summary, gpa, university, major, graduationYear, skills, experiences } = req.body;
  try {
    const [existing] = await db.query('SELECT id FROM cv_profiles WHERE user_id = ?', [req.user.id]);
    let cvId;

    if (existing.length > 0) {
      cvId = existing[0].id;
      await db.query(
        'UPDATE cv_profiles SET headline=?, summary=?, gpa=?, university=?, major=?, graduation_year=? WHERE id=?',
        [headline, summary, gpa, university, major, graduationYear, cvId],
      );
    } else {
      const [result] = await db.query(
        'INSERT INTO cv_profiles (user_id, headline, summary, gpa, university, major, graduation_year) VALUES (?,?,?,?,?,?,?)',
        [req.user.id, headline, summary, gpa, university, major, graduationYear],
      );
      cvId = result.insertId;
    }

    // Update skills
    await db.query('DELETE FROM cv_skills WHERE cv_id = ?', [cvId]);
    if (skills?.length) {
      await db.query('INSERT INTO cv_skills (cv_id, skill_name) VALUES ?', [skills.map((s) => [cvId, s])]);
    }

    res.json({ success: true, message: 'Lưu CV thành công' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/cv/upload', authenticate, authorize('STUDENT'), upload.single('cv'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'Không có file' });
  const url = `/uploads/cv/${req.file.filename}`;
  await db.query(
    'UPDATE cv_profiles SET pdf_url = ? WHERE user_id = ?',
    [url, req.user.id],
  );
  res.json({ success: true, data: { url } });
});

// =================== ADMIN ===================
router.patch('/admin/jobs/:id/approve', authenticate, authorize('ADMIN'), jobController.approveJob);
router.patch('/admin/jobs/:id/reject', authenticate, authorize('ADMIN'), jobController.rejectJob);

router.get('/admin/stats', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const [[{ totalJobs }]] = await db.query("SELECT COUNT(*) as totalJobs FROM jobs WHERE status='APPROVED'");
    const [[{ totalStudents }]] = await db.query("SELECT COUNT(*) as totalStudents FROM users WHERE role='STUDENT'");
    const [[{ totalEmployers }]] = await db.query("SELECT COUNT(*) as totalEmployers FROM users WHERE role='EMPLOYER'");
    const [[{ totalApplications }]] = await db.query('SELECT COUNT(*) as totalApplications FROM applications');

    const [jobsByIndustry] = await db.query(
      "SELECT industry, COUNT(*) as count FROM jobs WHERE status='APPROVED' GROUP BY industry",
    );
    const [hotSkills] = await db.query(
      'SELECT skill_name as skill, COUNT(*) as count FROM cv_skills GROUP BY skill_name ORDER BY count DESC LIMIT 10',
    );

    res.json({
      success: true,
      data: { totalJobs, totalStudents, totalEmployers, totalApplications, jobsByIndustry, hotSkills },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
