const CvModel = require('../models/CvProfile');
const { AppError, asyncHandler } = require('../middlewares/errorHandler');

// GET /api/cv/my
exports.getMyCv = asyncHandler(async (req, res) => {
  const cv = await CvModel.findByUserId(req.user.id);
  // Return null data (not 404) — frontend checks if CV exists
  res.json({ success: true, data: cv });
});

// POST /api/cv  or  PUT /api/cv/my  — upsert
exports.saveCv = asyncHandler(async (req, res) => {
  const { headline, summary, gpa, university, major, graduationYear, skills, experiences } = req.body;

  if (!skills?.length) throw new AppError('Cần ít nhất 1 kỹ năng', 400);

  await CvModel.upsert(req.user.id, { headline, summary, gpa, university, major, graduationYear, skills, experiences });

  const cv = await CvModel.findByUserId(req.user.id);
  res.json({ success: true, data: cv, message: 'Lưu CV thành công!' });
});

// GET /api/cv/user/:userId  — Employer or Admin views candidate CV
exports.getCvByUserId = asyncHandler(async (req, res) => {
  const cv = await CvModel.findByUserId(Number(req.params.userId));
  if (!cv) return res.json({ success: true, data: null });
  res.json({ success: true, data: cv });
});

// POST /api/cv/upload  — multer handled in route, this just saves the URL
exports.uploadPdf = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('Không có file được upload', 400);

  const url = `/uploads/cv/${req.file.filename}`;
  await CvModel.updatePdfUrl(req.user.id, url);

  res.json({ success: true, data: { url }, message: 'Upload CV PDF thành công!' });
});
