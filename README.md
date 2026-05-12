# InternHub — Hệ thống Quản lý Việc làm & Thực tập Sinh viên

> RIPT1307-01-2026 | Nhóm X | Kỳ thi hết phần

---

## 🚀 Cấu trúc dự án

```
internhub/
├── frontend/          ← React + TypeScript + UmiJS + Ant Design
│   ├── src/
│   │   ├── pages/
│   │   │   ├── auth/          login, register
│   │   │   ├── student/       dashboard, jobs, cv, applications
│   │   │   ├── employer/      dashboard, jobs, candidates
│   │   │   └── admin/         dashboard, users, jobs
│   │   ├── services/          API calls (auth, jobs, cv, applications)
│   │   ├── utils/             matching engine, helpers
│   │   ├── types/             TypeScript interfaces
│   │   └── constants/         skills list, industries
│   └── .umirc.ts              UmiJS config (routes, proxy)
│
└── backend/           ← Node.js + Express + MySQL
    ├── src/
    │   ├── config/    database.js, schema.sql
    │   ├── controllers/  auth, jobs, applications
    │   ├── middlewares/  JWT auth, role guard
    │   ├── routes/    index.js (all routes)
    │   ├── services/  matching engine, email (Nodemailer)
    │   └── utils/     seed.js
    └── uploads/cv/    CV PDF files
```

---

## ⚙️ Cài đặt môi trường

### Yêu cầu
- Node.js >= 18
- MySQL >= 8.0
- npm >= 9

### 1. Clone repo & cài packages

```bash
git clone https://github.com/YourTeam/RIPT1307-01-2026-NhomX-KTHP.git
cd RIPT1307-01-2026-NhomX-KTHP

# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

### 2. Tạo database MySQL

```bash
mysql -u root -p < backend/src/config/schema.sql
```

### 3. Cấu hình Backend

```bash
cd backend
cp .env.example .env
# Chỉnh sửa .env: DB_PASSWORD, MAIL_USER, MAIL_PASS, JWT_SECRET
```

### 4. Seed dữ liệu mẫu

```bash
cd backend
npm run seed
# Tạo: student@test.com / employer@test.com / admin@test.com (pass: 123456)
```

### 5. Chạy project

```bash
# Terminal 1 — Backend (port 3001)
cd backend
npm run dev

# Terminal 2 — Frontend (port 3000)
cd frontend
npm run dev
```

### Truy cập: http://localhost:3000

---

## 🌐 Deploy Netlify (Frontend)

```bash
cd frontend
npm run build
# Deploy thư mục dist/ lên Netlify
# Thêm _redirects file: /* /index.html 200
```

---

## 🔑 Tài khoản test

| Role | Email | Password |
|------|-------|----------|
| Sinh viên | student@test.com | 123456 |
| Doanh nghiệp | employer@test.com | 123456 |
| Admin | admin@test.com | 123456 |

---

## 🧩 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + UmiJS + Ant Design 5 |
| State | UmiJS Model (built-in) |
| Router | UmiJS Routes (file-based) |
| HTTP | Axios + JWT Interceptor |
| Backend | Node.js + Express |
| Database | MySQL 8 |
| Auth | JWT + bcrypt |
| File Upload | Multer |
| Email | Nodemailer |
| Charts | @ant-design/charts |

---

## ⭐ Tính năng nâng cao

### Job Matching Engine (AI giả lập)
- Tính `matchScore = % kỹ năng trùng giữa CV và job`
- Hiển thị badge: "⭐ Phù hợp 92%", "Phù hợp 74%"...
- File: `frontend/src/utils/matching.ts` + `backend/src/services/matching.js`

### CV Ranking cho nhà tuyển dụng
- Ứng viên được xếp hạng từ cao đến thấp theo matchScore
- Hiển thị "#1 Best Candidate"
- File: `frontend/src/pages/employer/candidates/index.tsx`

### Email Automation
- Apply thành công → email xác nhận
- Duyệt hồ sơ → email thông báo
- Từ chối → email phản hồi
- File: `backend/src/services/email.js`

### Dashboard & Charts
- Bar chart: việc làm theo ngành
- Pie chart: trạng thái ứng tuyển
- Table: kỹ năng hot
- File: `frontend/src/pages/admin/dashboard/index.tsx`

---

## 🌿 Git Workflow

```bash
# Mỗi thành viên tạo branch riêng
git checkout -b feat/ten-thanh-vien-module

# Commit thường xuyên
git add .
git commit -m "feat: add job matching engine"
git push origin feat/ten-thanh-vien-module

# Tạo Pull Request → merge vào main
```

### Branch Convention
- `feat/auth` — Đăng nhập/đăng ký
- `feat/student-jobs` — Trang tìm việc
- `feat/cv-builder` — CV Builder
- `feat/employer` — Quản lý doanh nghiệp
- `feat/admin` — Admin dashboard
- `feat/matching` — Matching engine
- `feat/email` — Email automation

---

## 📋 API Endpoints

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| POST | /api/auth/register | - | Đăng ký |
| POST | /api/auth/login | - | Đăng nhập |
| GET | /api/auth/me | ✓ | Thông tin user |
| GET | /api/jobs | - | Danh sách job |
| POST | /api/jobs | EMPLOYER | Tạo job |
| GET | /api/jobs/my | EMPLOYER | Job của tôi |
| POST | /api/applications | STUDENT | Ứng tuyển |
| GET | /api/applications/my | STUDENT | Ứng tuyển của tôi |
| GET | /api/applications/job/:id | EMPLOYER | Ứng viên của job |
| PATCH | /api/applications/:id/status | EMPLOYER | Duyệt/từ chối |
| GET | /api/cv/my | STUDENT | CV của tôi |
| POST | /api/cv | STUDENT | Lưu CV |
| POST | /api/cv/upload | STUDENT | Upload PDF |
| PATCH | /api/admin/jobs/:id/approve | ADMIN | Duyệt job |
| GET | /api/admin/stats | ADMIN | Thống kê |
