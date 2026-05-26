const express = require('express');
const cors    = require('cors');
const path    = require('path');
require('dotenv').config();

const routes = require('./routes/index');
const { errorHandler } = require('./middlewares/errorHandler');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Security & Logging ────────────────────────────────────────────────────
app.set('trust proxy', 1); // trust first proxy (for rate limiter IP detection)

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));

// Simple request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    const color = res.statusCode >= 500 ? '\x1b[31m' : res.statusCode >= 400 ? '\x1b[33m' : '\x1b[32m';
    console.log(`${color}${req.method}\x1b[0m ${req.path} ${res.statusCode} — ${ms}ms`);
  });
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ── Routes ────────────────────────────────────────────────────────────────
app.use('/api', routes);

// Health check
app.get('/health', (req, res) =>
  res.json({ status: 'ok', uptime: process.uptime(), time: new Date().toISOString() }));

// 404
app.use((req, res) =>
  res.status(404).json({ success: false, message: `Cannot ${req.method} ${req.path}` }));

// Global error handler (must be last)
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('\x1b[36m%s\x1b[0m', `\n  🚀 InternHub API`);
  console.log(`  📡 http://localhost:${PORT}`);
  console.log(`  🌍 Env: ${process.env.NODE_ENV ?? 'development'}\n`);
});

module.exports = app;
