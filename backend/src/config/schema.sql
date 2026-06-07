-- ============================================
-- InternHub Database Schema
-- Run: mysql -u root -p < schema.sql
-- ============================================

CREATE DATABASE IF NOT EXISTS internhub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE internhub;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  email       VARCHAR(255) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,
  full_name   VARCHAR(255) NOT NULL,
  role        ENUM('STUDENT', 'EMPLOYER', 'ADMIN') NOT NULL DEFAULT 'STUDENT',
  avatar      VARCHAR(500),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  user_id     INT NOT NULL,
  name        VARCHAR(255) NOT NULL,
  logo        VARCHAR(500),
  description TEXT,
  website     VARCHAR(255),
  industry    VARCHAR(100),
  verified    BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  company_id  INT NOT NULL,
  title       VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT,
  industry    ENUM('IT','MARKETING','BUSINESS','DESIGN','ACCOUNTING','OTHER') NOT NULL,
  type        ENUM('FULL_TIME','INTERNSHIP','PART_TIME') NOT NULL,
  salary_min  INT,
  salary_max  INT,
  location    VARCHAR(255),
  remote      BOOLEAN DEFAULT FALSE,
  deadline    DATE NOT NULL,
  status      ENUM('PENDING','APPROVED','REJECTED','CLOSED') DEFAULT 'PENDING',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Job skills (many-to-many via join table)
CREATE TABLE IF NOT EXISTS job_skills (
  job_id      INT NOT NULL,
  skill_name  VARCHAR(100) NOT NULL,
  PRIMARY KEY (job_id, skill_name),
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

-- CV profiles
CREATE TABLE IF NOT EXISTS cv_profiles (
  id               INT PRIMARY KEY AUTO_INCREMENT,
  user_id          INT NOT NULL UNIQUE,
  headline         VARCHAR(255),
  summary          TEXT,
  gpa              DECIMAL(3,2),
  university       VARCHAR(255),
  major            VARCHAR(255),
  graduation_year  INT,
  pdf_url          VARCHAR(500),
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- CV skills
CREATE TABLE IF NOT EXISTS cv_skills (
  cv_id       INT NOT NULL,
  skill_name  VARCHAR(100) NOT NULL,
  PRIMARY KEY (cv_id, skill_name),
  FOREIGN KEY (cv_id) REFERENCES cv_profiles(id) ON DELETE CASCADE
);

-- Experiences
CREATE TABLE IF NOT EXISTS experiences (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  cv_id       INT NOT NULL,
  company     VARCHAR(255) NOT NULL,
  position    VARCHAR(255) NOT NULL,
  start_date  DATE,
  end_date    DATE,
  current     BOOLEAN DEFAULT FALSE,
  description TEXT,
  FOREIGN KEY (cv_id) REFERENCES cv_profiles(id) ON DELETE CASCADE
);

-- Applications
CREATE TABLE IF NOT EXISTS applications (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  user_id       INT NOT NULL,
  job_id        INT NOT NULL,
  match_score   INT DEFAULT 0,
  status        ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
  employer_note TEXT,
  applied_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_application (user_id, job_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  user_id     INT NOT NULL,
  type        ENUM('APPLY_SUCCESS','APPLICATION_APPROVED','APPLICATION_REJECTED','NEW_APPLICANT') NOT NULL,
  title       VARCHAR(255) NOT NULL,
  message     TEXT NOT NULL,
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_industry ON jobs(industry);
CREATE INDEX idx_applications_user ON applications(user_id);
CREATE INDEX idx_applications_job ON applications(job_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
