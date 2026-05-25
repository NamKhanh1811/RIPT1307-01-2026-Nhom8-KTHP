const jwt = require('jsonwebtoken');
const UserModel = require('../models/User');
const NotificationModel = require('../models/Notification');
const db = require('../config/database');
const { AppError, asyncHandler } = require('../middlewares/errorHandler');

const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
  );

// POST /api/auth/register
exports.register = asyncHandler(async (req, res) => {
  const { email, password, fullName, role } = req.body;

  const existing = await UserModel.findByEmail(email);
  if (existing) throw new AppError('Email này đã được sử dụng', 409);

  const userId = await UserModel.create({ email, password, fullName, role });

  // Auto-create company placeholder for employers
  if (role === 'EMPLOYER') {
    await db.query('INSERT INTO companies (user_id, name) VALUES (?, ?)', [userId, `${fullName}'s Company`]);
  }

  const user = { id: userId, email, fullName, role };
  const token = signToken(user);

  // Welcome notification
  await NotificationModel.create(
    userId,
    'APPLY_SUCCESS',
    'Chào mừng đến InternHub! 🎉',
    'Tài khoản của bạn đã được tạo thành công. Hãy bắt đầu tìm kiếm cơ hội việc làm!',
  );

  res.status(201).json({ success: true, data: { token, user } });
});

// POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const dbUser = await UserModel.findByEmail(email);
  if (!dbUser) throw new AppError('Email hoặc mật khẩu không đúng', 401);

  const isMatch = await UserModel.verifyPassword(password, dbUser.password);
  if (!isMatch) throw new AppError('Email hoặc mật khẩu không đúng', 401);

  const user = {
    id: dbUser.id,
    email: dbUser.email,
    fullName: dbUser.full_name,
    role: dbUser.role,
    avatar: dbUser.avatar,
    createdAt: dbUser.created_at,
  };
  const token = signToken(user);

  res.json({ success: true, data: { token, user } });
});

// GET /api/auth/me
exports.getMe = asyncHandler(async (req, res) => {
  const user = await UserModel.findById(req.user.id);
  if (!user) throw new AppError('User không tồn tại', 404);

  // Attach unread notification count
  const unreadCount = await NotificationModel.countUnread(user.id);
  res.json({ success: true, data: { ...user, unreadCount } });
});

// PUT /api/auth/change-password
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const dbUser = await UserModel.findByEmail(req.user.email);
  const isMatch = await UserModel.verifyPassword(currentPassword, dbUser.password);
  if (!isMatch) throw new AppError('Mật khẩu hiện tại không đúng', 400);
  if (newPassword.length < 6) throw new AppError('Mật khẩu mới ít nhất 6 ký tự', 400);

  const bcrypt = require('bcryptjs');
  const hash = await bcrypt.hash(newPassword, 12);
  await db.query('UPDATE users SET password = ? WHERE id = ?', [hash, req.user.id]);

  res.json({ success: true, message: 'Đổi mật khẩu thành công' });
});
