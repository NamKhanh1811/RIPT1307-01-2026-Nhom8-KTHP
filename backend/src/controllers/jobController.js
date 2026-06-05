const JobModel = require('../models/Job');
const db = require('../config/database');
const { AppError, asyncHandler } = require('../middlewares/errorHandler');

// GET /api/jobs
exports.getJobs = asyncHandler(async (req, res) => {
  const { keyword, industry, type, remote, page = 1, pageSize = 20 } = req.query;
  const { jobs, total } = await JobModel.findAll({ keyword, industry, type, remote, page, pageSize });
  res.json({ success: true, data: jobs, total, page: Number(page), pageSize: Number(pageSize) });
});

// GET /api/jobs/:id
exports.getJobById = asyncHandler(async (req, res) => {
  const job = await JobModel.findById(Number(req.params.id));
  if (!job) throw new AppError('Không tìm thấy tin tuyển dụng', 404);
  res.json({ success: true, data: job });
});

// GET /api/jobs/my  (Employer)
exports.getMyJobs = asyncHandler(async (req, res) => {
  const [companies] = await db.query('SELECT id FROM companies WHERE user_id = ?', [req.user.id]);
  if (!companies.length) return res.json({ success: true, data: [] });
  const jobs = await JobModel.findByCompany(companies[0].id);
  res.json({ success: true, data: jobs });
});

// POST /api/jobs  (Employer)
exports.createJob = asyncHandler(async (req, res) => {
  const [companies] = await db.query('SELECT id FROM companies WHERE user_id = ?', [req.user.id]);
  if (!companies.length) throw new AppError('Bạn chưa có thông tin công ty', 400);

  // Validate deadline is today or in future (compare date only, ignore time)
  const deadlineDate = new Date(req.body.deadline);
  deadlineDate.setHours(23, 59, 59, 999); // cho phép chọn ngày hôm nay
  if (deadlineDate < new Date()) {
    throw new AppError('Hạn nộp phải là hôm nay hoặc ngày trong tương lai', 400);
  }

  const jobId = await JobModel.create({ companyId: companies[0].id, ...req.body });
  const job = await JobModel.findById(jobId);
  res.status(201).json({ success: true, data: job, message: 'Đăng tin thành công! Đang chờ admin duyệt.' });
});

// PUT /api/jobs/:id  (Employer)
exports.updateJob = asyncHandler(async (req, res) => {
  const job = await JobModel.findById(Number(req.params.id));
  if (!job) throw new AppError('Không tìm thấy tin tuyển dụng', 404);

  // Verify ownership
  const [companies] = await db.query('SELECT id FROM companies WHERE user_id = ?', [req.user.id]);
  if (!companies.length || job.company_id !== companies[0].id) {
    throw new AppError('Bạn không có quyền chỉnh sửa tin này', 403);
  }

  await JobModel.update(Number(req.params.id), req.body);
  const updated = await JobModel.findById(Number(req.params.id));
  res.json({ success: true, data: updated, message: 'Cập nhật tin tuyển dụng thành công' });
});

// DELETE /api/jobs/:id  (Employer)
exports.deleteJob = asyncHandler(async (req, res) => {
  const job = await JobModel.findById(Number(req.params.id));
  if (!job) throw new AppError('Không tìm thấy tin tuyển dụng', 404);

  const [companies] = await db.query('SELECT id FROM companies WHERE user_id = ?', [req.user.id]);
  if (!companies.length || job.company_id !== companies[0].id) {
    throw new AppError('Bạn không có quyền xóa tin này', 403);
  }

  await JobModel.delete(Number(req.params.id));
  res.json({ success: true, message: 'Đã xóa tin tuyển dụng' });
});

// PATCH /api/admin/jobs/:id/approve  (Admin)
exports.approveJob = asyncHandler(async (req, res) => {
  const job = await JobModel.findById(Number(req.params.id));
  if (!job) throw new AppError('Không tìm thấy tin tuyển dụng', 404);

  await JobModel.updateStatus(Number(req.params.id), 'APPROVED');

  // Notify employer
  const NotificationModel = require('../models/Notification');
  const [company] = await db.query('SELECT user_id FROM companies WHERE id = ?', [job.company_id]);
  if (company.length) {
    await NotificationModel.create(
      company[0].user_id,
      'NEW_APPLICANT',
      'Tin tuyển dụng đã được duyệt ✅',
      `Tin "${job.title}" của bạn đã được admin phê duyệt và hiện đang tuyển dụng.`,
    );
  }

  res.json({ success: true, message: `Đã duyệt tin: ${job.title}` });
});

// PATCH /api/admin/jobs/:id/reject  (Admin)
exports.rejectJob = asyncHandler(async (req, res) => {
  const job = await JobModel.findById(Number(req.params.id));
  if (!job) throw new AppError('Không tìm thấy tin tuyển dụng', 404);

  await JobModel.updateStatus(Number(req.params.id), 'REJECTED');

  // Notify employer with reason
  const NotificationModel = require('../models/Notification');
  const [company] = await db.query('SELECT user_id FROM companies WHERE id = ?', [job.company_id]);
  if (company.length) {
    const reason = req.body.reason ? ` Lý do: ${req.body.reason}` : '';
    await NotificationModel.create(
      company[0].user_id,
      'APPLICATION_REJECTED',
      'Tin tuyển dụng chưa được duyệt ❌',
      `Tin "${job.title}" chưa đáp ứng yêu cầu đăng tải.${reason}`,
    );
  }

  res.json({ success: true, message: 'Đã từ chối tin tuyển dụng' });
});