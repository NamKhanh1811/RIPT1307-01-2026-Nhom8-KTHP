const NotificationModel = require('../models/Notification');
const { asyncHandler } = require('../middlewares/errorHandler');

exports.getMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await NotificationModel.findByUser(req.user.id);
  const unread = await NotificationModel.countUnread(req.user.id);
  res.json({ success: true, data: notifications, unread });
});

exports.markAsRead = asyncHandler(async (req, res) => {
  await NotificationModel.markRead(Number(req.params.id), req.user.id);
  res.json({ success: true });
});

exports.markAllRead = asyncHandler(async (req, res) => {
  await NotificationModel.markAllRead(req.user.id);
  res.json({ success: true, message: 'Da danh dau tat ca la da doc' });
});
