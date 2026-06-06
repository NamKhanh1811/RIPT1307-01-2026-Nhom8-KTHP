const Message = require('../models/Message');
const Connection = require('../models/Connection');

const messageController = {
  // GET /api/messages/conversations — Danh sách hội thoại (sidebar)
  async getConversations(req, res) {
    try {
      const conversations = await Message.getConversations(req.user.id);
      res.json({ success: true, data: conversations });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // GET /api/messages/conversations/:id — Lịch sử tin nhắn
  async getMessages(req, res) {
    try {
      const convId = +req.params.id;
      // Kiểm tra quyền truy cập
      const isMember = await Message.isMember(convId, req.user.id);
      if (!isMember) return res.status(403).json({ success: false, message: 'Không có quyền truy cập' });

      const { page = 1, pageSize = 50 } = req.query;
      const messages = await Message.getMessages(convId, { page: +page, pageSize: +pageSize });

      // Đánh dấu đã đọc
      await Message.markAllRead(convId, req.user.id);

      res.json({ success: true, data: messages });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // POST /api/messages/conversations/:partnerId/start — Bắt đầu hoặc mở hội thoại
  async startConversation(req, res) {
    try {
      const partnerId = +req.params.partnerId;

      // Chỉ được nhắn tin khi đã kết nối
      const status = await Connection.getStatus(req.user.id, partnerId);
      if (!status || status.status !== 'ACCEPTED') {
        return res.status(403).json({
          success: false,
          message: 'Bạn cần kết nối với người này trước khi nhắn tin',
        });
      }

      const conversation = await Message.getOrCreateConversation(req.user.id, partnerId);
      res.json({ success: true, data: conversation });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // POST /api/messages/conversations/:id/send — Gửi tin nhắn (REST fallback)
  async sendMessage(req, res) {
    try {
      const convId = +req.params.id;
      const { content } = req.body;
      if (!content?.trim()) return res.status(400).json({ success: false, message: 'Nội dung không được rỗng' });

      const isMember = await Message.isMember(convId, req.user.id);
      if (!isMember) return res.status(403).json({ success: false, message: 'Không có quyền truy cập' });

      const msg = await Message.send(convId, req.user.id, content.trim());

      // Emit socket
      const io = req.app.get('io');
      if (io) {
        io.to(`conv_${convId}`).emit('new_message', msg);
      }

      res.status(201).json({ success: true, data: msg });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // PATCH /api/messages/conversations/:id/read — Đánh dấu đã đọc
  async markRead(req, res) {
    try {
      const convId = +req.params.id;
      const isMember = await Message.isMember(convId, req.user.id);
      if (!isMember) return res.status(403).json({ success: false, message: 'Không có quyền truy cập' });
      await Message.markAllRead(convId, req.user.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // GET /api/messages/unread-count — Tổng tin chưa đọc (dùng cho badge)
  async getUnreadCount(req, res) {
    try {
      const total = await Message.getTotalUnread(req.user.id);
      res.json({ success: true, data: { total } });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // PATCH /api/messages/:msgId — Chỉnh sửa tin nhắn
  async editMessage(req, res) {
    try {
      const msgId = +req.params.msgId;
      const { content } = req.body;
      if (!content?.trim()) return res.status(400).json({ success: false, message: 'Nội dung không được rỗng' });

      const updated = await Message.update(msgId, req.user.id, content.trim());
      if (!updated) return res.status(403).json({ success: false, message: 'Không tìm thấy tin nhắn hoặc bạn không có quyền sửa' });

      // Emit socket để các client khác cập nhật realtime
      const io = req.app.get('io');
      if (io) {
        io.to(`conv_${updated.conversation_id}`).emit('message_edited', updated);
      }

      res.json({ success: true, data: updated });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // DELETE /api/messages/:msgId — Xoá tin nhắn
  async deleteMessage(req, res) {
    try {
      const msgId = +req.params.msgId;

      // Lấy message trước để biết conversation_id cho socket emit
      const msg = await Message.findById(msgId);
      if (!msg) return res.status(404).json({ success: false, message: 'Không tìm thấy tin nhắn' });

      const ok = await Message.delete(msgId, req.user.id);
      if (!ok) return res.status(403).json({ success: false, message: 'Bạn không có quyền xoá tin nhắn này' });

      const io = req.app.get('io');
      if (io) {
        io.to(`conv_${msg.conversation_id}`).emit('message_deleted', { id: msgId, conversation_id: msg.conversation_id });
      }

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
};

module.exports = messageController;
