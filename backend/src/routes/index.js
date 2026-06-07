const express = require('express');
const multer  = require('multer');
const path    = require('path');

const authController         = require('../controllers/authController');
const jobController          = require('../controllers/jobController');
const applicationController  = require('../controllers/applicationController');
const cvController           = require('../controllers/cvController');
const adminController        = require('../controllers/adminController');
const companyController      = require('../controllers/companyController');
const notificationController = require('../controllers/notificationController');
const postController         = require('../controllers/postController');

const { authenticate, authorize, rateLimiter } = require('../middlewares/auth');
const { validate, registerRules, loginRules, jobRules, cvRules, idParamRules } = require('../middlewares/validate');

const router = express.Router();

// Multer for CV PDF
const upload = multer({
  storage: multer.diskStorage({
    destination: 'uploads/cv/',
    filename: (req, file, cb) =>
      cb(null, `cv_${req.user.id}_${Date.now()}${path.extname(file.originalname)}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    file.mimetype === 'application/pdf' ? cb(null, true) : cb(new Error('Chi chap nhan file PDF')),
});

// Multer for Avatar image
const uploadAvatar = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const fs = require('fs');
      fs.mkdirSync('uploads/avatars', { recursive: true });
      cb(null, 'uploads/avatars/');
    },
    filename: (req, file, cb) =>
      cb(null, `avatar_${req.user.id}_${Date.now()}${path.extname(file.originalname)}`),
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('Chi chap nhan file anh')),
});

// ── AUTH ──────────────────────────────────────────────────────────────────
router.post('/auth/register', registerRules, validate, authController.register);
router.post('/auth/login',    loginRules,    validate,
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 10, message: 'Qua nhieu lan dang nhap, thu lai sau 15 phut' }),
  authController.login);
router.get ('/auth/me',               authenticate, authController.getMe);
router.put ('/auth/change-password',  authenticate, authController.changePassword);
router.post('/auth/avatar',           authenticate, uploadAvatar.single('avatar'), authController.uploadAvatar);

// ── JOBS (public) ─────────────────────────────────────────────────────────
router.get('/jobs',     jobController.getJobs);

// ── JOBS (employer) ───────────────────────────────────────────────────────
router.get   ('/jobs/my',  authenticate, authorize('EMPLOYER'), jobController.getMyJobs);

router.get('/jobs/:id', idParamRules, validate, jobController.getJobById);
router.post  ('/jobs',     authenticate, authorize('EMPLOYER'), jobRules, validate, jobController.createJob);
router.put   ('/jobs/:id', authenticate, authorize('EMPLOYER'), idParamRules, jobRules, validate, jobController.updateJob);
router.delete('/jobs/:id', authenticate, authorize('EMPLOYER'), idParamRules, validate, jobController.deleteJob);

// ── CV ────────────────────────────────────────────────────────────────────
router.get ('/cv/my',           authenticate, cvController.getMyCv);
router.post('/cv',              authenticate, authorize('STUDENT'), cvRules, validate, cvController.saveCv);
router.put ('/cv/my',           authenticate, authorize('STUDENT'), cvRules, validate, cvController.saveCv);
router.get ('/cv/user/:userId', authenticate, authorize('EMPLOYER', 'ADMIN'), cvController.getCvByUserId);
router.post('/cv/upload',       authenticate, authorize('STUDENT'), upload.single('cv'), cvController.uploadPdf);

// ── APPLICATIONS ──────────────────────────────────────────────────────────
router.post ('/applications',               authenticate, authorize('STUDENT'),  applicationController.apply);
router.get  ('/applications/my',            authenticate, authorize('STUDENT'),  applicationController.getMyApplications);
router.get  ('/applications/job/:jobId',    authenticate, authorize('EMPLOYER'), applicationController.getApplicationsByJob);
router.patch('/applications/:id/status',    authenticate, authorize('EMPLOYER'), applicationController.updateStatus);

// ── COMPANY ───────────────────────────────────────────────────────────────
router.get('/company/my', authenticate, authorize('EMPLOYER'), companyController.getMyCompany);
router.put('/company/my', authenticate, authorize('EMPLOYER'), companyController.updateCompany);

// ── NOTIFICATIONS ─────────────────────────────────────────────────────────
router.get  ('/notifications',           authenticate, notificationController.getMyNotifications);
router.patch('/notifications/read-all',  authenticate, notificationController.markAllRead);
router.patch('/notifications/:id/read',  authenticate, notificationController.markAsRead);

// ── ADMIN ─────────────────────────────────────────────────────────────────
router.get   ('/admin/stats',              authenticate, authorize('ADMIN'), adminController.getStats);
router.get   ('/admin/users',              authenticate, authorize('ADMIN'), adminController.getAllUsers);
router.delete('/admin/users/:id',          authenticate, authorize('ADMIN'), idParamRules, validate, adminController.deleteUser);
router.get   ('/admin/jobs',               authenticate, authorize('ADMIN'), adminController.getAllJobs);
router.get   ('/admin/applications',       authenticate, authorize('ADMIN'), applicationController.getAllApplications);
router.patch ('/admin/jobs/:id/approve',   authenticate, authorize('ADMIN'), idParamRules, validate, jobController.approveJob);
router.patch ('/admin/jobs/:id/reject',    authenticate, authorize('ADMIN'), idParamRules, validate, jobController.rejectJob);

// ── POSTS ─────────────────────────────────────────────────────────────────
router.get   ('/posts',                         authenticate, postController.getPosts);
router.post  ('/posts',                         authenticate, postController.createPost);
router.delete('/posts/:id',                     authenticate, postController.deletePost);
router.post  ('/posts/:id/like',                authenticate, postController.toggleLike);
router.get   ('/posts/:id/comments',            authenticate, postController.getComments);
router.post  ('/posts/:id/comments',            authenticate, postController.addComment);
router.delete('/posts/:id/comments/:commentId', authenticate, postController.deleteComment);

module.exports = router;