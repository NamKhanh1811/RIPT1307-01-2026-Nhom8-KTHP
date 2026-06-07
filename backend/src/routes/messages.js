const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticate } = require('../middlewares/auth');

router.use(authenticate);

// Lấy danh sách hội thoại (sidebar)
router.get('/conversations', messageController.getConversations);

// Bắt đầu hoặc mở lại hội thoại với 1 người
router.post('/conversations/:partnerId/start', messageController.startConversation);

// Lịch sử tin nhắn
router.get('/conversations/:id', messageController.getMessages);

// Gửi tin nhắn (REST fallback, socket là chính)
router.post('/conversations/:id/send', messageController.sendMessage);

// Đánh dấu đã đọc
router.patch('/conversations/:id/read', messageController.markRead);

// Badge: tổng tin chưa đọc
router.get('/unread-count', messageController.getUnreadCount);

// Chỉnh sửa tin nhắn (chỉ người gửi)
router.patch('/:msgId', messageController.editMessage);

// Xoá tin nhắn (chỉ người gửi)
router.delete('/:msgId', messageController.deleteMessage);

module.exports = router;
