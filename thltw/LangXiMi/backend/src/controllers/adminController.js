const UserModel = require('../models/User');
const JobModel = require('../models/Job');
const ApplicationModel = require('../models/Application');
const CvModel = require('../models/CvProfile');
const db = require('../config/database');
const { AppError, asyncHandler } = require('../middlewares/errorHandler');

// GET /api/admin/users
exports.getAllUsers = asyncHandler(async (req, res) => {
  const { search, role, page = 1, pageSize = 20 } = req.query;
  const users = await UserModel.findAll({ search, role, page, pageSize });
  const total = await UserModel.countAll();
  res.json({ success: true, data: users, total });
});

// DELETE /api/admin/users/:id
exports.deleteUser = asyncHandler(async (req, res) => {
  const user = await UserModel.findById(Number(req.params.id));
  if (!user) throw new AppError('User không tồn tại', 404);
  if (user.role === 'ADMIN') throw new AppError('Không thể xóa tài khoản Admin', 403);
  await UserModel.delete(Number(req.params.id));
  res.json({ success: true, message: `Đã xóa user: ${user.fullName}` });
});

// GET /api/admin/jobs
exports.getAllJobs = asyncHandler(async (req, res) => {
  const jobs = await JobModel.findAllAdmin();
  res.json({ success: true, data: jobs, total: jobs.length });
});

// GET /api/admin/stats  — Full analytics
exports.getStats = asyncHandler(async (req, res) => {
  // Parallel queries for performance
  const [
    [[{ totalJobs }]],
    [[{ totalStudents }]],
    [[{ totalEmployers }]],
    [[{ totalApplications }]],
    [[{ totalCompanies }]],
    applicationsByStatus,
    jobsByIndustry,
    hotSkills,
    monthlyApplications,
    [[{ newUsersThisMonth }]],
    [[{ newJobsThisMonth }]],
  ] = await Promise.all([
    db.query("SELECT COUNT(*) AS totalJobs FROM jobs WHERE status='APPROVED'"),
    db.query("SELECT COUNT(*) AS totalStudents FROM users WHERE role='STUDENT'"),
    db.query("SELECT COUNT(*) AS totalEmployers FROM users WHERE role='EMPLOYER'"),
    db.query('SELECT COUNT(*) AS totalApplications FROM applications'),
    db.query('SELECT COUNT(*) AS totalCompanies FROM companies WHERE verified=1'),
    db.query("SELECT status, COUNT(*) AS count FROM applications GROUP BY status"),
    db.query("SELECT industry, COUNT(*) AS count FROM jobs WHERE status='APPROVED' GROUP BY industry ORDER BY count DESC"),
    CvModel.getHotSkills(10),
    ApplicationModel.getMonthlyTrend(6),
    db.query("SELECT COUNT(*) AS newUsersThisMonth FROM users WHERE MONTH(created_at)=MONTH(NOW()) AND YEAR(created_at)=YEAR(NOW())"),
    db.query("SELECT COUNT(*) AS newJobsThisMonth FROM jobs WHERE MONTH(created_at)=MONTH(NOW()) AND YEAR(created_at)=YEAR(NOW())"),
  ]);

  const approved = applicationsByStatus.find((s) => s.status === 'APPROVED')?.count ?? 0;
  const successRate = totalApplications > 0 ? Math.round((approved / totalApplications) * 100) : 0;

  res.json({
    success: true,
    data: {
      totalJobs,
      totalStudents,
      totalEmployers,
      totalApplications,
      totalCompanies,
      successRate,
      newUsersThisMonth,
      newJobsThisMonth,
      applicationsByStatus,
      jobsByIndustry,
      hotSkills,
      monthlyApplications,
    },
  });
});
