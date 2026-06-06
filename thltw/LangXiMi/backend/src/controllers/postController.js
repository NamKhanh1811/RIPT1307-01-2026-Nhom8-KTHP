const PostModel = require('../models/Post');

exports.getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const offset = (page - 1) * pageSize;
    const posts = await PostModel.findAll(pageSize, offset, req.user?.id);
    res.json({ success: true, data: posts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createPost = async (req, res) => {
  try {
    const { content, imageUrl } = req.body;
    if (!content?.trim()) return res.status(400).json({ success: false, message: 'Nội dung không được trống' });
    const id = await PostModel.create(req.user.id, content.trim(), imageUrl || null);
    res.json({
      success: true,
      data: {
        id, userId: req.user.id, content: content.trim(), imageUrl: imageUrl || null,
        likesCount: 0, commentsCount: 0, isLiked: false,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const ok = await PostModel.delete(req.params.id, req.user.id);
    if (!ok) return res.status(403).json({ success: false, message: 'Không có quyền xóa' });
    res.json({ success: true, data: null });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.toggleLike = async (req, res) => {
  try {
    const result = await PostModel.toggleLike(req.params.id, req.user.id);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getComments = async (req, res) => {
  try {
    const comments = await PostModel.getComments(req.params.id);
    res.json({ success: true, data: comments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ success: false, message: 'Nội dung không được trống' });
    const comment = await PostModel.addComment(req.params.id, req.user.id, content.trim());
    res.json({ success: true, data: comment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const ok = await PostModel.deleteComment(req.params.commentId, req.user.id);
    if (!ok) return res.status(403).json({ success: false, message: 'Không có quyền xóa' });
    res.json({ success: true, data: null });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
