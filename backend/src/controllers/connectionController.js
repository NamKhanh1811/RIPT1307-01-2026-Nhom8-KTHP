const Connection = require('../models/Connection');
const Notification = require('../models/Notification');
const db = require('../config/database');

const connectionController = {
  // GET /api/network/users
  async getUsers(req, res) {
    try {
      const { page = 1, pageSize = 20, keyword = '', role = '' } = req.query;
      const users = await Connection.getUsersWithConnectionStatus(req.user.id, {
        page: +page, pageSize: +pageSize, keyword, role,
      });
      res.json({ success: true, data: users });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // GET /api/network/connections
  async getConnections(req, res) {
    try {
      const { page = 1, pageSize = 20, keyword = '' } = req.query;
      const result = await Connection.getConnections(req.user.id, {
        page: +page, pageSize: +pageSize, keyword,
      });
      res.json({ success: true, ...result });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // GET /api/network/pending
  async getPendingRequests(req, res) {
    try {
      const requests = await Connection.getPendingRequests(req.user.id);
      res.json({ success: true, data: requests });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // GET /api/network/suggestions
  async getSuggestions(req, res) {
    try {
      const suggestions = await Connection.getSuggestions(req.user.id, 12);
      res.json({ success: true, data: suggestions });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // POST /api/network/connect/:userId
  async sendRequest(req, res) {
    try {
      const receiverId = +req.params.userId;
      if (receiverId === req.user.id) {
        return res.status(400).json({ success: false, message: 'Không thể kết nối với chính mình' });
      }

      const existing = await Connection.getStatus(req.user.id, receiverId);
      if (existing) {
        return res.status(409).json({ success: false, message: 'Đã có yêu cầu kết nối tồn tại' });
      }

      const connectionId = await Connection.sendRequest(req.user.id, receiverId);

      // Notification.create nhận 4 tham số riêng lẻ, KHÔNG phải object
      await Notification.create(
        receiverId,
        'CONNECTION_REQUEST',
        'Lời mời kết nối mới',
        `${req.user.fullName} đã gửi lời mời kết nối với bạn`,
      );

      const io = req.app.get('io');
      if (io) {
        io.to(`user_${receiverId}`).emit('connection_request', {
          connectionId,
          from: { id: req.user.id, fullName: req.user.fullName, avatar: req.user.avatar },
        });
      }

      res.status(201).json({ success: true, data: { connectionId }, message: 'Đã gửi lời mời kết nối' });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ success: false, message: 'Đã gửi lời mời trước đó' });
      }
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // PATCH /api/network/connections/:id/accept
  async acceptRequest(req, res) {
    try {
      const connectionId = +req.params.id;
      const ok = await Connection.updateStatus(connectionId, 'ACCEPTED');
      if (!ok) return res.status(404).json({ success: false, message: 'Không tìm thấy lời mời' });

      const [[row]] = await db.execute(
        `SELECT requester_id FROM connections WHERE id = ?`, [connectionId]
      );
      if (row) {
        // Notification.create nhận 4 tham số riêng lẻ, KHÔNG phải object
        await Notification.create(
          row.requester_id,
          'CONNECTION_ACCEPTED',
          'Kết nối được chấp nhận',
          `${req.user.fullName} đã chấp nhận lời mời kết nối của bạn`,
        );
        const io = req.app.get('io');
        if (io) {
          io.to(`user_${row.requester_id}`).emit('connection_accepted', {
            by: { id: req.user.id, fullName: req.user.fullName, avatar: req.user.avatar },
          });
        }
      }

      res.json({ success: true, message: 'Đã chấp nhận kết nối' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // PATCH /api/network/connections/:id/reject
  async rejectRequest(req, res) {
    try {
      const ok = await Connection.updateStatus(+req.params.id, 'REJECTED');
      if (!ok) return res.status(404).json({ success: false, message: 'Không tìm thấy lời mời' });
      res.json({ success: true, message: 'Đã từ chối lời mời' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // DELETE /api/network/connections/:id
  async removeConnection(req, res) {
    try {
      const ok = await Connection.remove(+req.params.id);
      if (!ok) return res.status(404).json({ success: false, message: 'Không tìm thấy kết nối' });
      res.json({ success: true, message: 'Đã huỷ kết nối' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
};

module.exports = connectionController;