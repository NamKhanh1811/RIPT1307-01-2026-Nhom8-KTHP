const jwt = require('jsonwebtoken');

// ── JWT Authentication ────────────────────────────────────────────────────
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Bạn chưa đăng nhập' });
  }
  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    const msg = err.name === 'TokenExpiredError'
      ? 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại'
      : 'Token không hợp lệ';
    return res.status(401).json({ success: false, message: msg });
  }
};

// ── Role Authorization ───────────────────────────────────────────────────
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({
      success: false,
      message: `Chức năng này yêu cầu quyền: ${roles.join(' hoặc ')}`,
    });
  }
  next();
};

// ── Simple In-Memory Rate Limiter ────────────────────────────────────────
// Dùng cho login endpoint để chống brute force
const rateLimitStore = new Map(); // ip -> { count, resetAt }

const rateLimiter = ({ windowMs = 15 * 60 * 1000, max = 10, message = 'Quá nhiều yêu cầu, thử lại sau' } = {}) => {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const record = rateLimitStore.get(ip);

    if (!record || now > record.resetAt) {
      rateLimitStore.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }

    record.count += 1;
    if (record.count > max) {
      const retryAfter = Math.ceil((record.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({ success: false, message, retryAfter });
    }
    next();
  };
};

// Clean up expired entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitStore.entries()) {
    if (now > record.resetAt) rateLimitStore.delete(ip);
  }
}, 10 * 60 * 1000);

// ── Ownership Check ──────────────────────────────────────────────────────
// Middleware factory: verify resource belongs to req.user
const ownerOrAdmin = (getOwnerId) => async (req, res, next) => {
  try {
    const ownerId = await getOwnerId(req);
    if (req.user.role === 'ADMIN' || req.user.id === ownerId) return next();
    return res.status(403).json({ success: false, message: 'Bạn không có quyền thực hiện hành động này' });
  } catch {
    return res.status(500).json({ success: false, message: 'Lỗi kiểm tra quyền truy cập' });
  }
};

module.exports = { authenticate, authorize, rateLimiter, ownerOrAdmin };
