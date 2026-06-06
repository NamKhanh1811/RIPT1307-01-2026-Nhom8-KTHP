const express = require('express');
const router = express.Router();
const connectionController = require('../controllers/connectionController');
const { authenticate } = require('../middlewares/auth');

// Tất cả routes yêu cầu đăng nhập
router.use(authenticate);

// Khám phá người dùng
router.get('/users', connectionController.getUsers);

// Gợi ý kết nối
router.get('/suggestions', connectionController.getSuggestions);

// Danh sách kết nối 
router.get('/connections', connectionController.getConnections);

// Lời mời đang chờ (nhận được)
router.get('/pending', connectionController.getPendingRequests);

// Gửi lời mời kết nối
router.post('/connect/:userId', connectionController.sendRequest);

// Chấp nhận lời mời
router.patch('/connections/:id/accept', connectionController.acceptRequest);

// Từ chối lời mời
router.patch('/connections/:id/reject', connectionController.rejectRequest);

// Huỷ kết nối (unfriend)
router.delete('/connections/:id', connectionController.removeConnection);

module.exports = router;
