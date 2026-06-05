const { validationResult, body, param, query } = require('express-validator');

// Collect validation errors and return 422
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// Auth validators
const registerRules = [
  body('email').isEmail().withMessage('Email không hợp lệ').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Mật khẩu ít nhất 6 ký tự'),
  body('fullName').trim().isLength({ min: 2 }).withMessage('Họ tên ít nhất 2 ký tự'),
  body('role').isIn(['STUDENT', 'EMPLOYER']).withMessage('Role không hợp lệ'),
];

const loginRules = [
  body('email').isEmail().withMessage('Email không hợp lệ').normalizeEmail(),
  body('password').notEmpty().withMessage('Mật khẩu không được trống'),
];

// Job validators
const jobRules = [
  body('title').trim().isLength({ min: 5 }).withMessage('Tiêu đề ít nhất 5 ký tự'),
  body('description').trim().isLength({ min: 20 }).withMessage('Mô tả ít nhất 20 ký tự'),
  body('industry').isIn(['IT','MARKETING','BUSINESS','DESIGN','ACCOUNTING','OTHER']).withMessage('Ngành không hợp lệ'),
  body('type').isIn(['FULL_TIME','INTERNSHIP','PART_TIME']).withMessage('Loại hình không hợp lệ'),
  body('location').trim().notEmpty().withMessage('Địa điểm không được trống'),
  body('deadline').isDate({ format: 'YYYY-MM-DD' }).withMessage('Hạn nộp không hợp lệ'),
  body('skills').isArray({ min: 1 }).withMessage('Cần ít nhất 1 kỹ năng'),
  body('salaryMin')
    .customSanitizer((v) => {
      if (v === '' || v === null || v === undefined) return null;
      const n = Number(String(v).replace(/,/g, ''));
      return isNaN(n) ? null : n;
    })
    .custom((v) => v === null || (typeof v === 'number' && v >= 0))
    .withMessage('Lương tối thiểu không hợp lệ'),
  body('salaryMax')
    .customSanitizer((v) => {
      if (v === '' || v === null || v === undefined) return null;
      const n = Number(String(v).replace(/,/g, ''));
      return isNaN(n) ? null : n;
    })
    .custom((v) => v === null || (typeof v === 'number' && v >= 0))
    .withMessage('Lương tối đa không hợp lệ'),
];

// CV validators
const cvRules = [
  body('headline').trim().isLength({ min: 3 }).withMessage('Tiêu đề CV ít nhất 3 ký tự'),
  body('skills').isArray({ min: 1 }).withMessage('Cần ít nhất 1 kỹ năng'),
  body('gpa').optional({ nullable: true }).isFloat({ min: 0, max: 4 }).withMessage('GPA phải từ 0-4'),
];

// ID param validator
const idParamRules = [
  param('id').isInt({ min: 1 }).withMessage('ID không hợp lệ'),
];

module.exports = { validate, registerRules, loginRules, jobRules, cvRules, idParamRules };