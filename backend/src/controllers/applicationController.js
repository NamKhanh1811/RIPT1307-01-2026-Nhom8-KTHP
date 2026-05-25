const ApplicationModel = require('../models/Application');
const CvModel = require('../models/CvProfile');
const JobModel = require('../models/Job');
const NotificationModel = require('../models/Notification');
const UserModel = require('../models/User');
const emailService = require('../services/email');
const { calcMatchScore } = require('../services/matching');
const { AppError, asyncHandler } = require('../middlewares/errorHandler');

// POST /api/applications  — Student applies to a job
exports.apply = asyncHandler(async (req, res) => {
  const { jobId } = req.body;
  if (!jobId) throw new AppError('Thiếu jobId', 400);

  const userId = req.user.id;

  // Check job exists and is still open
  const job = await JobModel.findById(Number(jobId));
  if (!job) throw new AppError('Tin tuyển dụng không tồn tại', 404);
  if (job.status !== 'APPROVED') throw new AppError('Tin tuyển dụng không còn hoạt động', 400);
  if (new Date(job.deadline) < new Date()) throw new AppError('Đã hết hạn nộp hồ sơ', 400);

  // Check duplicate application
  const already = await ApplicationModel.existsByUserAndJob(userId, Number(jobId));
  if (already) throw new AppError('Bạn đã ứng tuyển vị trí này rồi', 409);

  // Calculate match score using CV skills
  const cvSkills = await CvModel.getSkillsByUserId(userId);
  const matchScore = calcMatchScore(cvSkills, job.skills ?? []);

  const appId = await ApplicationModel.create({ userId, jobId: Number(jobId), matchScore });

  // === Side effects (non-blocking) ===
  const user = await UserModel.findById(userId);
  Promise.allSettled([
    // Email to student
    emailService.sendApplyConfirmation(user.email, user.fullName, job.title, job.company?.name ?? ''),

    // Notification to student
    NotificationModel.create(userId, 'APPLY_SUCCESS',
      'Ứng tuyển thành công! 🎯',
      `Hồ sơ của bạn cho vị trí "${job.title}" tại ${job.company?.name ?? ''} đã được gửi đi.`),

    // Notification to employer
    (async () => {
      const db = require('../config/database');
      const [companies] = await db.query('SELECT user_id FROM companies WHERE id = ?', [job.company_id]);
      if (companies.length) {
        await NotificationModel.create(
          companies[0].user_id, 'NEW_APPLICANT',
          'Có ứng viên mới! 👤',
          `${user.fullName} vừa ứng tuyển vào "${job.title}" — Match score: ${matchScore}%`,
        );
      }
    })(),
  ]);

  res.status(201).json({
    success: true,
    message: 'Ứng tuyển thành công! Email xác nhận đã được gửi.',
    data: { id: appId, jobId: Number(jobId), userId, matchScore, status: 'PENDING' },
  });
});

// GET /api/applications/my  — Student views their applications
exports.getMyApplications = asyncHandler(async (req, res) => {
  const apps = await ApplicationModel.findByUser(req.user.id);
  res.json({ success: true, data: apps, total: apps.length });
});

// GET /api/applications/job/:jobId  — Employer views applicants (sorted by matchScore DESC)
exports.getApplicationsByJob = asyncHandler(async (req, res) => {
  const jobId = Number(req.params.jobId);

  // Verify employer owns this job
  const job = await JobModel.findById(jobId);
  if (!job) throw new AppError('Không tìm thấy tin tuyển dụng', 404);

  const db = require('../config/database');
  const [companies] = await db.query('SELECT id FROM companies WHERE user_id = ?', [req.user.id]);
  if (!companies.length || job.company_id !== companies[0].id) {
    throw new AppError('Bạn không có quyền xem ứng viên của job này', 403);
  }

  const apps = await ApplicationModel.findByJob(jobId);
  res.json({ success: true, data: apps, total: apps.length });
});

// PATCH /api/applications/:id/status  — Employer approves or rejects
exports.updateStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  if (!['APPROVED', 'REJECTED'].includes(status)) {
    throw new AppError('Trạng thái không hợp lệ', 400);
  }

  const appId = Number(req.params.id);
  const existing = await ApplicationModel.findWithDetail(appId);
  if (!existing) throw new AppError('Không tìm thấy đơn ứng tuyển', 404);
  if (existing.status !== 'PENDING') throw new AppError('Đơn ứng tuyển đã được xử lý rồi', 400);

  await ApplicationModel.updateStatus(appId, status, note);

  // === Notify student (non-blocking) ===
  const notifTitle = status === 'APPROVED'
    ? '🎉 Hồ sơ của bạn được duyệt!'
    : 'Cập nhật hồ sơ ứng tuyển';
  const notifMsg = status === 'APPROVED'
    ? `Chúc mừng! Hồ sơ vị trí "${existing.jobTitle}" tại ${existing.companyName} đã được chấp nhận.${note ? ` Ghi chú: ${note}` : ''}`
    : `Hồ sơ vị trí "${existing.jobTitle}" tại ${existing.companyName} chưa phù hợp lần này.${note ? ` Phản hồi: ${note}` : ''}`;

  Promise.allSettled([
    NotificationModel.create(existing.user_id,
      status === 'APPROVED' ? 'APPLICATION_APPROVED' : 'APPLICATION_REJECTED',
      notifTitle, notifMsg),

    status === 'APPROVED'
      ? emailService.sendApplicationApproved(existing.userEmail, existing.userName, existing.jobTitle, existing.companyName, note)
      : emailService.sendApplicationRejected(existing.userEmail, existing.userName, existing.jobTitle, existing.companyName, note),
  ]);

  res.json({ success: true, message: status === 'APPROVED' ? 'Đã duyệt ứng viên' : 'Đã từ chối ứng viên' });
});

// GET /api/admin/applications  — Admin
exports.getAllApplications = asyncHandler(async (req, res) => {
  const apps = await ApplicationModel.findAll();
  res.json({ success: true, data: apps, total: apps.length });
});
