/**
 * Seed script — chạy: npm run seed
 * Tạo dữ liệu mẫu để test
 */
const bcrypt = require('bcryptjs');
const db = require('../config/database');
require('dotenv').config();

async function seed() {
  console.log('🌱 Seeding database...');

  const hash = await bcrypt.hash('123456', 10);

  // Users
  await db.query('DELETE FROM applications');
  await db.query('DELETE FROM job_skills');
  await db.query('DELETE FROM jobs');
  await db.query('DELETE FROM cv_skills');
  await db.query('DELETE FROM cv_profiles');
  await db.query('DELETE FROM companies');
  await db.query('DELETE FROM users');

  const [u1] = await db.query(
    "INSERT INTO users (email, password, full_name, role) VALUES ('student@test.com', ?, 'Nguyễn Minh Khoa', 'STUDENT')",
    [hash],
  );
  const [u2] = await db.query(
    "INSERT INTO users (email, password, full_name, role) VALUES ('employer@test.com', ?, 'Trần Thị Mai', 'EMPLOYER')",
    [hash],
  );
  const [u3] = await db.query(
    "INSERT INTO users (email, password, full_name, role) VALUES ('admin@test.com', ?, 'Admin InternHub', 'ADMIN')",
    [hash],
  );

  // Company
  const [c1] = await db.query(
    "INSERT INTO companies (user_id, name, industry, verified) VALUES (?, 'FPT Software', 'IT', true)",
    [u2.insertId],
  );

  // Jobs
  const [j1] = await db.query(
    `INSERT INTO jobs (company_id, title, description, industry, type, salary_min, salary_max, location, remote, deadline, status)
     VALUES (?, 'Frontend Developer Intern', 'Thực tập frontend với React', 'IT', 'INTERNSHIP', 5000000, 8000000, 'Hà Nội', true, '2026-08-01', 'APPROVED')`,
    [c1.insertId],
  );

  await db.query('INSERT INTO job_skills (job_id, skill_name) VALUES ?', [
    [[j1.insertId, 'React'], [j1.insertId, 'TypeScript'], [j1.insertId, 'Ant Design'], [j1.insertId, 'Git']],
  ]);

  // Student CV
  const [cv1] = await db.query(
    "INSERT INTO cv_profiles (user_id, headline, university, major, gpa) VALUES (?, 'Frontend Developer Intern', 'Đại học Bách Khoa Hà Nội', 'CNTT', 3.5)",
    [u1.insertId],
  );

  await db.query('INSERT INTO cv_skills (cv_id, skill_name) VALUES ?', [
    [[cv1.insertId, 'React'], [cv1.insertId, 'TypeScript'], [cv1.insertId, 'JavaScript'], [cv1.insertId, 'Git']],
  ]);

  console.log('✅ Seed complete!');
  console.log('📧 student@test.com / 123456');
  console.log('📧 employer@test.com / 123456');
  console.log('📧 admin@test.com / 123456');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
