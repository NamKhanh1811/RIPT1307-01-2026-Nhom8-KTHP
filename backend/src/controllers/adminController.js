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

// GET /api/admin/stats
exports.getStats = asyncHandler(async (req, res) => {
  const [
    [[{ totalJobs }]],
    [[{ totalStudents }]],
    [[{ totalEmployers }]],
    [[{ totalApplications }]],
    [[{ totalCompanies }]],
    [applicationsByStatus],
    [jobsByIndustry],
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

  // mysql2 trả COUNT dạng BigInt/string — ép về Number
  const totalApps = Number(totalApplications);
  const approvedCount = Number(
    applicationsByStatus.find((s) => s.status === 'APPROVED')?.count ?? 0,
  );
  const successRate = totalApps > 0 ? Math.round((approvedCount / totalApps) * 100) : 0;

  res.json({
    success: true,
    data: {
      totalJobs:         Number(totalJobs),
      totalStudents:     Number(totalStudents),
      totalEmployers:    Number(totalEmployers),
      totalApplications: totalApps,
      totalCompanies:    Number(totalCompanies),
      successRate,
      newUsersThisMonth: Number(newUsersThisMonth),
      newJobsThisMonth:  Number(newJobsThisMonth),
      applicationsByStatus: applicationsByStatus.map((s) => ({
        status: s.status,
        count:  Number(s.count),
      })),
      jobsByIndustry: jobsByIndustry.map((s) => ({
        industry: s.industry || 'OTHER',
        count:    Number(s.count),
      })),
      hotSkills: hotSkills.map((s) => ({
        skill: s.skill,
        count: Number(s.count),
      })),
      monthlyApplications: monthlyApplications.map((s) => ({
        month: s.month,
        count: Number(s.count),
      })),
    },
  });
});
