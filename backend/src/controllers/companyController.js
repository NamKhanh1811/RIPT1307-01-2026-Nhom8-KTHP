const db = require('../config/database');
const { AppError, asyncHandler } = require('../middlewares/errorHandler');

exports.getMyCompany = asyncHandler(async (req, res) => {
  const [rows] = await db.query('SELECT * FROM companies WHERE user_id = ?', [req.user.id]);
  res.json({ success: true, data: rows[0] ?? null });
});

exports.updateCompany = asyncHandler(async (req, res) => {
  const { name, description, website, industry } = req.body;
  if (!name?.trim()) throw new AppError('Ten cong ty khong duoc trong', 400);
  const [existing] = await db.query('SELECT id FROM companies WHERE user_id = ?', [req.user.id]);
  if (existing.length > 0) {
    await db.query('UPDATE companies SET name=?, description=?, website=?, industry=? WHERE user_id=?',
      [name, description, website, industry, req.user.id]);
  } else {
    await db.query('INSERT INTO companies (user_id, name, description, website, industry) VALUES (?,?,?,?,?)',
      [req.user.id, name, description, website, industry]);
  }
  const [updated] = await db.query('SELECT * FROM companies WHERE user_id = ?', [req.user.id]);
  res.json({ success: true, data: updated[0], message: 'Cap nhat thanh cong' });
});
