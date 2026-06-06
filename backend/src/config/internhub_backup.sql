-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: localhost    Database: internhub
-- ------------------------------------------------------
-- Server version	9.2.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `applications`
--

DROP TABLE IF EXISTS `applications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `applications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `job_id` int NOT NULL,
  `match_score` int DEFAULT '0',
  `status` enum('PENDING','APPROVED','REJECTED') COLLATE utf8mb4_unicode_ci DEFAULT 'PENDING',
  `employer_note` text COLLATE utf8mb4_unicode_ci,
  `applied_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_application` (`user_id`,`job_id`),
  KEY `idx_applications_user` (`user_id`),
  KEY `idx_applications_job` (`job_id`),
  CONSTRAINT `applications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `applications_ibfk_2` FOREIGN KEY (`job_id`) REFERENCES `jobs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `applications`
--

LOCK TABLES `applications` WRITE;
/*!40000 ALTER TABLE `applications` DISABLE KEYS */;
INSERT INTO `applications` VALUES (1,4,2,0,'APPROVED',NULL,'2026-06-04 15:08:43','2026-06-04 15:14:12'),(2,1,2,50,'APPROVED',NULL,'2026-06-04 15:11:50','2026-06-05 04:17:57'),(3,1,1,75,'PENDING',NULL,'2026-06-04 15:11:53','2026-06-04 15:11:53'),(4,4,1,25,'REJECTED',NULL,'2026-06-05 03:25:51','2026-06-05 04:17:41'),(5,4,3,0,'APPROVED',NULL,'2026-06-05 04:08:02','2026-06-06 19:05:25'),(6,9,1,25,'PENDING',NULL,'2026-06-06 19:11:01','2026-06-06 19:11:01');
/*!40000 ALTER TABLE `applications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `companies`
--

DROP TABLE IF EXISTS `companies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `companies` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `logo` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `website` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `industry` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `verified` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `companies_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `companies`
--

LOCK TABLES `companies` WRITE;
/*!40000 ALTER TABLE `companies` DISABLE KEYS */;
INSERT INTO `companies` VALUES (1,2,'FPT Software',NULL,NULL,NULL,'IT',1,'2026-05-08 03:49:43'),(2,7,'Trần Nam Khánh\'s Company',NULL,NULL,NULL,NULL,0,'2026-06-05 14:08:32'),(3,8,'Lee Min Ho\'s Company',NULL,NULL,NULL,NULL,0,'2026-06-06 14:13:37');
/*!40000 ALTER TABLE `companies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `connections`
--

DROP TABLE IF EXISTS `connections`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `connections` (
  `id` int NOT NULL AUTO_INCREMENT,
  `requester_id` int NOT NULL,
  `receiver_id` int NOT NULL,
  `status` enum('PENDING','ACCEPTED','REJECTED','BLOCKED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_connection` (`requester_id`,`receiver_id`),
  KEY `idx_connections_requester` (`requester_id`),
  KEY `idx_connections_receiver` (`receiver_id`),
  KEY `idx_connections_status` (`status`),
  CONSTRAINT `connections_ibfk_1` FOREIGN KEY (`requester_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `connections_ibfk_2` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `connections_chk_1` CHECK ((`requester_id` <> `receiver_id`))
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `connections`
--

LOCK TABLES `connections` WRITE;
/*!40000 ALTER TABLE `connections` DISABLE KEYS */;
INSERT INTO `connections` VALUES (1,2,4,'ACCEPTED','2026-06-06 08:26:51','2026-06-06 08:28:20'),(2,4,5,'PENDING','2026-06-06 08:27:33','2026-06-06 08:27:33'),(14,4,8,'ACCEPTED','2026-06-06 17:24:50','2026-06-06 17:25:04'),(17,1,4,'ACCEPTED','2026-06-06 18:40:11','2026-06-06 18:40:24');
/*!40000 ALTER TABLE `connections` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `conversations`
--

DROP TABLE IF EXISTS `conversations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `conversations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user1_id` int NOT NULL,
  `user2_id` int NOT NULL,
  `last_message` text COLLATE utf8mb4_unicode_ci,
  `last_message_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_conversation` (`user1_id`,`user2_id`),
  KEY `user2_id` (`user2_id`),
  CONSTRAINT `conversations_ibfk_1` FOREIGN KEY (`user1_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `conversations_ibfk_2` FOREIGN KEY (`user2_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `conversations_chk_1` CHECK ((`user1_id` < `user2_id`))
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `conversations`
--

LOCK TABLES `conversations` WRITE;
/*!40000 ALTER TABLE `conversations` DISABLE KEYS */;
INSERT INTO `conversations` VALUES (1,2,4,'alo','2026-06-06 14:01:54','2026-06-06 08:30:44'),(2,1,4,'alo','2026-06-06 17:45:30','2026-06-06 14:08:16'),(3,4,8,'lô','2026-06-06 17:28:25','2026-06-06 14:15:25');
/*!40000 ALTER TABLE `conversations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cv_profiles`
--

DROP TABLE IF EXISTS `cv_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cv_profiles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `headline` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `summary` text COLLATE utf8mb4_unicode_ci,
  `gpa` decimal(3,2) DEFAULT NULL,
  `university` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `major` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `graduation_year` int DEFAULT NULL,
  `pdf_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `cv_profiles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cv_profiles`
--

LOCK TABLES `cv_profiles` WRITE;
/*!40000 ALTER TABLE `cv_profiles` DISABLE KEYS */;
INSERT INTO `cv_profiles` VALUES (1,1,'Frontend Developer Intern',NULL,3.50,'Đại học Bách Khoa Hà Nội','CNTT',NULL,NULL,'2026-05-08 03:49:43'),(3,4,'frontend','hello',4.00,'bkhoa','it',NULL,'/uploads/cv/cv_4_1780594766271.pdf','2026-06-04 17:39:26'),(4,9,'frontend','hello',3.50,'bkhoa','it',2028,NULL,'2026-06-06 19:10:53');
/*!40000 ALTER TABLE `cv_profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cv_skills`
--

DROP TABLE IF EXISTS `cv_skills`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cv_skills` (
  `cv_id` int NOT NULL,
  `skill_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`cv_id`,`skill_name`),
  CONSTRAINT `cv_skills_ibfk_1` FOREIGN KEY (`cv_id`) REFERENCES `cv_profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cv_skills`
--

LOCK TABLES `cv_skills` WRITE;
/*!40000 ALTER TABLE `cv_skills` DISABLE KEYS */;
INSERT INTO `cv_skills` VALUES (1,'Git'),(1,'JavaScript'),(1,'React'),(1,'TypeScript'),(3,'Express'),(3,'React'),(4,'C++'),(4,'Next.js'),(4,'PostgreSQL'),(4,'React'),(4,'Spring Boot');
/*!40000 ALTER TABLE `cv_skills` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `experiences`
--

DROP TABLE IF EXISTS `experiences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `experiences` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cv_id` int NOT NULL,
  `company` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `position` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `current` tinyint(1) DEFAULT '0',
  `description` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `cv_id` (`cv_id`),
  CONSTRAINT `experiences_ibfk_1` FOREIGN KEY (`cv_id`) REFERENCES `cv_profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `experiences`
--

LOCK TABLES `experiences` WRITE;
/*!40000 ALTER TABLE `experiences` DISABLE KEYS */;
INSERT INTO `experiences` VALUES (6,3,'rqr','qửq',NULL,NULL,0,'reqe');
/*!40000 ALTER TABLE `experiences` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `job_skills`
--

DROP TABLE IF EXISTS `job_skills`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `job_skills` (
  `job_id` int NOT NULL,
  `skill_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`job_id`,`skill_name`),
  CONSTRAINT `job_skills_ibfk_1` FOREIGN KEY (`job_id`) REFERENCES `jobs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_skills`
--

LOCK TABLES `job_skills` WRITE;
/*!40000 ALTER TABLE `job_skills` DISABLE KEYS */;
INSERT INTO `job_skills` VALUES (1,'Ant Design'),(1,'Git'),(1,'React'),(1,'TypeScript'),(2,'Java'),(2,'Node.js'),(3,'Node.js'),(4,'Power BI'),(5,'Excel'),(6,'MySQL'),(6,'PostgreSQL');
/*!40000 ALTER TABLE `job_skills` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jobs`
--

DROP TABLE IF EXISTS `jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jobs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `company_id` int NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `requirements` text COLLATE utf8mb4_unicode_ci,
  `industry` enum('IT','MARKETING','BUSINESS','DESIGN','ACCOUNTING','OTHER') COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('FULL_TIME','INTERNSHIP','PART_TIME') COLLATE utf8mb4_unicode_ci NOT NULL,
  `salary_min` int DEFAULT NULL,
  `salary_max` int DEFAULT NULL,
  `location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `remote` tinyint(1) DEFAULT '0',
  `deadline` date NOT NULL,
  `status` enum('PENDING','APPROVED','REJECTED','CLOSED') COLLATE utf8mb4_unicode_ci DEFAULT 'PENDING',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  KEY `idx_jobs_status` (`status`),
  KEY `idx_jobs_industry` (`industry`),
  CONSTRAINT `jobs_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jobs`
--

LOCK TABLES `jobs` WRITE;
/*!40000 ALTER TABLE `jobs` DISABLE KEYS */;
INSERT INTO `jobs` VALUES (1,1,'Frontend Developer Intern','Thực tập frontend với React',NULL,'IT','INTERNSHIP',5000000,8000000,'Hà Nội',1,'2026-08-01','APPROVED','2026-05-08 03:49:43','2026-05-08 03:49:43'),(2,1,'Backend Dev','làm việc tại vị trí backend','java','IT','INTERNSHIP',0,1000000,'Hà Nội',1,'2026-06-12','APPROVED','2026-06-04 04:14:49','2026-06-04 04:15:41'),(3,1,'Frontend','làm việc với mô hình data warehouse','ewfw','IT','INTERNSHIP',500000,1000000,'Hà Nội',1,'2026-06-19','APPROVED','2026-06-05 04:02:52','2026-06-05 04:07:29'),(4,1,'Nhân Viên Sales','làm việc và bán hàng cho khách hàng','yêu cầu cần có kĩ năng giao tiếp tốt','BUSINESS','FULL_TIME',500000,4000000,'Hà Nội',0,'2026-06-08','APPROVED','2026-06-05 08:53:57','2026-06-05 08:54:19'),(5,2,'Marketing','làm văn phòng marketing cho công ty','canva','MARKETING','FULL_TIME',1000000,2000000,'Hà Nội',0,'2026-06-08','APPROVED','2026-06-05 14:09:34','2026-06-05 14:10:39'),(6,2,'Data Analyst','làm việc như nô lệ trong môi trường áp lực','SQL','IT','PART_TIME',1500000,4000000,'Hà Nội',0,'2026-06-06','REJECTED','2026-06-05 14:13:41','2026-06-05 14:14:01');
/*!40000 ALTER TABLE `jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `conversation_id` int NOT NULL,
  `sender_id` int NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `is_edited` tinyint(1) DEFAULT '0',
  `is_deleted` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `sender_id` (`sender_id`),
  KEY `idx_messages_conversation` (`conversation_id`,`created_at`),
  KEY `idx_messages_unread` (`conversation_id`,`is_read`),
  CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `messages`
--

LOCK TABLES `messages` WRITE;
/*!40000 ALTER TABLE `messages` DISABLE KEYS */;
INSERT INTO `messages` VALUES (1,1,2,'hello :)',1,'2026-06-06 08:35:52',1,0),(2,1,4,'hi',1,'2026-06-06 08:43:44',0,0),(3,1,2,'lô',1,'2026-06-06 14:00:33',0,0),(4,1,2,'alo',1,'2026-06-06 14:00:56',0,0),(5,1,2,'alo',1,'2026-06-06 14:01:15',0,0),(6,1,4,'alo',0,'2026-06-06 14:01:54',0,0),(7,2,1,'lô',1,'2026-06-06 14:08:20',0,0),(8,2,4,'alo',1,'2026-06-06 14:08:55',0,0),(9,2,4,'',1,'2026-06-06 14:09:11',0,1),(10,2,4,'sr',1,'2026-06-06 14:09:38',0,0),(11,2,4,'123',1,'2026-06-06 14:09:53',0,0),(12,2,4,'adjqsnbde',1,'2026-06-06 14:10:09',0,0),(13,3,4,'hello',1,'2026-06-06 15:52:22',0,0),(14,3,8,'lô',1,'2026-06-06 15:52:32',0,0),(15,3,8,'lô',1,'2026-06-06 16:13:15',0,0),(16,3,8,'hello',1,'2026-06-06 16:13:19',0,0),(17,3,8,'sbwo',1,'2026-06-06 16:13:20',0,0),(18,3,4,'lo',1,'2026-06-06 16:20:37',0,0),(19,3,8,'req',1,'2026-06-06 16:20:42',0,0),(20,3,4,'chào',1,'2026-06-06 16:20:47',0,0),(21,3,8,'',1,'2026-06-06 17:27:26',0,1),(22,3,8,'lô',1,'2026-06-06 17:28:25',0,0),(23,2,1,'alo',1,'2026-06-06 17:45:30',0,0);
/*!40000 ALTER TABLE `messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `type` enum('APPLY_SUCCESS','APPLICATION_APPROVED','APPLICATION_REJECTED','NEW_APPLICANT','CONNECTION_REQUEST','CONNECTION_ACCEPTED','NEW_MESSAGE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_notifications_user` (`user_id`,`is_read`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=59 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,2,'NEW_APPLICANT','Tin tuyển dụng đã được duyệt ✅','Tin \"Backend Dev\" của bạn đã được admin phê duyệt và hiện đang tuyển dụng.',1,'2026-06-04 04:15:41'),(2,4,'APPLY_SUCCESS','Ứng tuyển thành công! 🎯','Hồ sơ của bạn cho vị trí \"Backend Dev\" tại FPT Software đã được gửi đi.',1,'2026-06-04 15:08:43'),(3,2,'NEW_APPLICANT','Có ứng viên mới! 👤','Nguyễn Nam Khánh vừa ứng tuyển vào \"Backend Dev\" — Match score: 0%',1,'2026-06-04 15:08:43'),(4,1,'APPLY_SUCCESS','Ứng tuyển thành công! 🎯','Hồ sơ của bạn cho vị trí \"Backend Dev\" tại FPT Software đã được gửi đi.',1,'2026-06-04 15:11:50'),(5,2,'NEW_APPLICANT','Có ứng viên mới! 👤','Nguyễn Minh Khoa vừa ứng tuyển vào \"Backend Dev\" — Match score: 50%',1,'2026-06-04 15:11:50'),(6,1,'APPLY_SUCCESS','Ứng tuyển thành công! 🎯','Hồ sơ của bạn cho vị trí \"Frontend Developer Intern\" tại FPT Software đã được gửi đi.',1,'2026-06-04 15:11:53'),(7,2,'NEW_APPLICANT','Có ứng viên mới! 👤','Nguyễn Minh Khoa vừa ứng tuyển vào \"Frontend Developer Intern\" — Match score: 75%',1,'2026-06-04 15:11:53'),(8,4,'APPLICATION_APPROVED','🎉 Hồ sơ của bạn được duyệt!','Chúc mừng! Hồ sơ vị trí \"Backend Dev\" tại FPT Software đã được chấp nhận.',1,'2026-06-04 15:14:12'),(9,4,'APPLY_SUCCESS','Ứng tuyển thành công! 🎯','Hồ sơ của bạn cho vị trí \"Frontend Developer Intern\" tại FPT Software đã được gửi đi.',1,'2026-06-05 03:25:51'),(10,2,'NEW_APPLICANT','Có ứng viên mới! 👤','Nguyễn Nam Khánh vừa ứng tuyển vào \"Frontend Developer Intern\" — Match score: 25%',1,'2026-06-05 03:25:51'),(11,2,'NEW_APPLICANT','Tin tuyển dụng đã được duyệt ✅','Tin \"Frontend\" của bạn đã được admin phê duyệt và hiện đang tuyển dụng.',1,'2026-06-05 04:07:29'),(12,4,'APPLY_SUCCESS','Ứng tuyển thành công! 🎯','Hồ sơ của bạn cho vị trí \"Frontend\" tại FPT Software đã được gửi đi.',1,'2026-06-05 04:08:02'),(13,2,'NEW_APPLICANT','Có ứng viên mới! 👤','Nguyễn Nam Khánh vừa ứng tuyển vào \"Frontend\" — Match score: 0%',1,'2026-06-05 04:08:02'),(14,4,'APPLICATION_REJECTED','Cập nhật hồ sơ ứng tuyển','Hồ sơ vị trí \"Frontend Developer Intern\" tại FPT Software chưa phù hợp lần này.',1,'2026-06-05 04:17:41'),(15,1,'APPLICATION_APPROVED','🎉 Hồ sơ của bạn được duyệt!','Chúc mừng! Hồ sơ vị trí \"Backend Dev\" tại FPT Software đã được chấp nhận.',1,'2026-06-05 04:17:57'),(16,2,'NEW_APPLICANT','Tin tuyển dụng đã được duyệt ✅','Tin \"Nhân Viên Sales\" của bạn đã được admin phê duyệt và hiện đang tuyển dụng.',1,'2026-06-05 08:54:19'),(17,5,'APPLY_SUCCESS','Chào mừng đến InternHub! 🎉','Tài khoản của bạn đã được tạo thành công. Hãy bắt đầu tìm kiếm cơ hội việc làm!',0,'2026-06-05 09:30:08'),(18,6,'APPLY_SUCCESS','Chào mừng đến InternHub! 🎉','Tài khoản của bạn đã được tạo thành công. Hãy bắt đầu tìm kiếm cơ hội việc làm!',0,'2026-06-05 09:32:58'),(19,7,'APPLY_SUCCESS','Chào mừng đến InternHub! 🎉','Tài khoản của bạn đã được tạo thành công. Hãy bắt đầu tìm kiếm cơ hội việc làm!',0,'2026-06-05 14:08:32'),(20,7,'NEW_APPLICANT','Tin tuyển dụng đã được duyệt ✅','Tin \"Marketing\" của bạn đã được admin phê duyệt và hiện đang tuyển dụng.',0,'2026-06-05 14:10:39'),(21,7,'APPLICATION_REJECTED','Tin tuyển dụng chưa được duyệt ❌','Tin \"Data Analyst\" chưa đáp ứng yêu cầu đăng tải.',0,'2026-06-05 14:14:01'),(22,1,'CONNECTION_REQUEST','Lời mời kết nối mới','undefined đã gửi lời mời kết nối với bạn',1,'2026-06-06 08:29:17'),(23,4,'CONNECTION_ACCEPTED','Kết nối được chấp nhận','Lee Min Ho đã chấp nhận lời mời kết nối của bạn',1,'2026-06-06 14:08:08'),(24,8,'APPLY_SUCCESS','Chào mừng đến InternHub! 🎉','Tài khoản của bạn đã được tạo thành công. Hãy bắt đầu tìm kiếm cơ hội việc làm!',0,'2026-06-06 14:13:37'),(25,4,'CONNECTION_REQUEST','Lời mời kết nối mới','Nguyễn Minh Khoa đã gửi lời mời kết nối với bạn',1,'2026-06-06 14:14:04'),(26,8,'CONNECTION_ACCEPTED','Kết nối được chấp nhận','undefined đã chấp nhận lời mời kết nối của bạn',0,'2026-06-06 14:14:16'),(27,8,'CONNECTION_ACCEPTED','Kết nối được chấp nhận','undefined đã chấp nhận lời mời kết nối của bạn',0,'2026-06-06 14:14:19'),(28,8,'CONNECTION_REQUEST','Lời mời kết nối mới','Nguyễn Nam Khánh đã gửi lời mời kết nối với bạn',0,'2026-06-06 14:15:03'),(29,4,'CONNECTION_ACCEPTED','Kết nối được chấp nhận','Lee Min Ho đã chấp nhận lời mời kết nối của bạn',1,'2026-06-06 14:15:16'),(30,8,'CONNECTION_REQUEST','Lời mời kết nối mới','Nguyễn Nam Khánh đã gửi lời mời kết nối với bạn',0,'2026-06-06 15:51:37'),(31,4,'CONNECTION_ACCEPTED','Kết nối được chấp nhận','Lee Min Ho đã chấp nhận lời mời kết nối của bạn',1,'2026-06-06 16:13:58'),(32,4,'CONNECTION_ACCEPTED','Kết nối được chấp nhận','Lee Min Ho đã chấp nhận lời mời kết nối của bạn',1,'2026-06-06 16:14:06'),(33,4,'CONNECTION_REQUEST','Lời mời kết nối mới','Nguyễn Minh Khoa đã gửi lời mời kết nối với bạn',1,'2026-06-06 16:26:52'),(34,8,'CONNECTION_ACCEPTED','Kết nối được chấp nhận','undefined đã chấp nhận lời mời kết nối của bạn',0,'2026-06-06 16:26:58'),(35,4,'CONNECTION_REQUEST','Lời mời kết nối mới','Nguyễn Minh Khoa đã gửi lời mời kết nối với bạn',1,'2026-06-06 16:27:24'),(36,8,'CONNECTION_ACCEPTED','Kết nối được chấp nhận','undefined đã chấp nhận lời mời kết nối của bạn',0,'2026-06-06 16:27:28'),(37,8,'CONNECTION_REQUEST','Lời mời kết nối mới','Nguyễn Nam Khánh đã gửi lời mời kết nối với bạn',0,'2026-06-06 17:18:23'),(38,4,'CONNECTION_ACCEPTED','Kết nối được chấp nhận','Lee Min Ho đã chấp nhận lời mời kết nối của bạn',1,'2026-06-06 17:18:27'),(39,8,'CONNECTION_REQUEST','Lời mời kết nối mới','Nguyễn Nam Khánh đã gửi lời mời kết nối với bạn',0,'2026-06-06 17:19:49'),(40,4,'CONNECTION_ACCEPTED','Kết nối được chấp nhận','Lee Min Ho đã chấp nhận lời mời kết nối của bạn',1,'2026-06-06 17:19:53'),(41,4,'CONNECTION_REQUEST','Lời mời kết nối mới','Nguyễn Minh Khoa đã gửi lời mời kết nối với bạn',1,'2026-06-06 17:22:19'),(42,8,'CONNECTION_ACCEPTED','Kết nối được chấp nhận','undefined đã chấp nhận lời mời kết nối của bạn',0,'2026-06-06 17:22:27'),(43,8,'CONNECTION_REQUEST','Lời mời kết nối mới','Nguyễn Nam Khánh đã gửi lời mời kết nối với bạn',0,'2026-06-06 17:22:47'),(44,4,'CONNECTION_ACCEPTED','Kết nối được chấp nhận','Lee Min Ho đã chấp nhận lời mời kết nối của bạn',1,'2026-06-06 17:23:26'),(45,8,'CONNECTION_REQUEST','Lời mời kết nối mới','Nguyễn Nam Khánh đã gửi lời mời kết nối với bạn',0,'2026-06-06 17:24:18'),(46,4,'CONNECTION_ACCEPTED','Kết nối được chấp nhận','Lee Min Ho đã chấp nhận lời mời kết nối của bạn',1,'2026-06-06 17:24:21'),(47,8,'CONNECTION_REQUEST','Lời mời kết nối mới','Nguyễn Nam Khánh đã gửi lời mời kết nối với bạn',0,'2026-06-06 17:24:50'),(48,4,'CONNECTION_ACCEPTED','Kết nối được chấp nhận','Lee Min Ho đã chấp nhận lời mời kết nối của bạn',1,'2026-06-06 17:25:04'),(49,4,'CONNECTION_REQUEST','Lời mời kết nối mới','Nguyễn Minh Khoa đã gửi lời mời kết nối với bạn',1,'2026-06-06 18:10:16'),(50,1,'CONNECTION_ACCEPTED','Kết nối được chấp nhận','Nguyễn Nam Khánh đã chấp nhận lời mời kết nối của bạn',1,'2026-06-06 18:10:22'),(51,4,'CONNECTION_REQUEST','Lời mời kết nối mới','Nguyễn Minh Khoa đã gửi lời mời kết nối với bạn',1,'2026-06-06 18:25:00'),(52,1,'CONNECTION_ACCEPTED','Kết nối được chấp nhận','Nguyễn Nam Khánh đã chấp nhận lời mời kết nối của bạn',1,'2026-06-06 18:25:48'),(53,4,'CONNECTION_REQUEST','Lời mời kết nối mới','undefined đã gửi lời mời kết nối với bạn',0,'2026-06-06 18:40:11'),(54,1,'CONNECTION_ACCEPTED','Kết nối được chấp nhận','Nguyễn Nam Khánh đã chấp nhận lời mời kết nối của bạn',0,'2026-06-06 18:40:24'),(55,4,'APPLICATION_APPROVED','🎉 Hồ sơ của bạn được duyệt!','Chúc mừng! Hồ sơ vị trí \"Frontend\" tại FPT Software đã được chấp nhận.',0,'2026-06-06 19:05:25'),(56,9,'APPLY_SUCCESS','Chào mừng đến LangXiMi! 🎉','Tài khoản của bạn đã được tạo thành công. Hãy bắt đầu tìm kiếm cơ hội việc làm!',0,'2026-06-06 19:07:47'),(57,9,'APPLY_SUCCESS','Ứng tuyển thành công! 🎯','Hồ sơ của bạn cho vị trí \"Frontend Developer Intern\" tại FPT Software đã được gửi đi.',0,'2026-06-06 19:11:01'),(58,2,'NEW_APPLICANT','Có ứng viên mới! 👤','Dean Winchester vừa ứng tuyển vào \"Frontend Developer Intern\" — Match score: 25%',0,'2026-06-06 19:11:01');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `post_comments`
--

DROP TABLE IF EXISTS `post_comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `post_comments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `post_id` int NOT NULL,
  `user_id` int NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `post_id` (`post_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `post_comments_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `post_comments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `post_comments`
--

LOCK TABLES `post_comments` WRITE;
/*!40000 ALTER TABLE `post_comments` DISABLE KEYS */;
INSERT INTO `post_comments` VALUES (1,1,4,'alo','2026-06-06 14:06:13');
/*!40000 ALTER TABLE `post_comments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `post_likes`
--

DROP TABLE IF EXISTS `post_likes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `post_likes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `post_id` int NOT NULL,
  `user_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_like` (`post_id`,`user_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `post_likes_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `post_likes_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `post_likes`
--

LOCK TABLES `post_likes` WRITE;
/*!40000 ALTER TABLE `post_likes` DISABLE KEYS */;
INSERT INTO `post_likes` VALUES (2,1,1,'2026-06-06 17:44:37');
/*!40000 ALTER TABLE `post_likes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `posts`
--

DROP TABLE IF EXISTS `posts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `posts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `posts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `posts`
--

LOCK TABLES `posts` WRITE;
/*!40000 ALTER TABLE `posts` DISABLE KEYS */;
INSERT INTO `posts` VALUES (1,4,'hello',NULL,'2026-06-06 14:06:03','2026-06-06 14:06:03');
/*!40000 ALTER TABLE `posts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('STUDENT','EMPLOYER','ADMIN') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'STUDENT',
  `avatar` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'student@test.com','$2a$10$cpDJg9oMgqOlb2lCCBIDXOWxj9sFBGjrCkam.UJY6MYBinnl5DqRS','Nguyễn Minh Khoa','STUDENT',NULL,'2026-05-08 03:49:43','2026-05-08 03:49:43'),(2,'employer@test.com','$2a$10$cpDJg9oMgqOlb2lCCBIDXOWxj9sFBGjrCkam.UJY6MYBinnl5DqRS','Trần Thị Mai','EMPLOYER','/uploads/avatars/avatar_2_1780744806555.png','2026-05-08 03:49:43','2026-06-06 11:20:06'),(3,'admin@test.com','$2a$10$cpDJg9oMgqOlb2lCCBIDXOWxj9sFBGjrCkam.UJY6MYBinnl5DqRS','Admin InternHub','ADMIN',NULL,'2026-05-08 03:49:43','2026-05-08 03:49:43'),(4,'khanhnn1811@gmail.com','$2a$10$VYrRKn/9N9MSNk3Xaaly7O.BME19TynUL8TCWDvUn16OHXC4I2wiK','Nguyễn Nam Khánh','STUDENT','/uploads/avatars/avatar_4_1780772684908.jpg','2026-05-08 03:58:38','2026-06-06 19:04:44'),(5,'employer1@test.com','$2a$12$263GTZcKjFnX/2s5cw8oLO3NnHmk771izr/AWRRH6Iw052GINymQu','Nguyễn Đức Hiếu','STUDENT',NULL,'2026-06-05 09:30:08','2026-06-05 09:30:08'),(6,'employer2@test.com','$2a$12$C3R3JEJw92zNryP4nBEmWebYUvv2ftzRCeCjeK60y5Hb4j9YIgsmi','Nguyễn Văn A','STUDENT',NULL,'2026-06-05 09:32:58','2026-06-05 09:32:58'),(7,'employer3@test.com','$2a$12$382eO7JTtj59sgYqW3.B4ezGa.4F4Wq4i40nB/ew.HPUISclCe19C','Trần Nam Khánh','EMPLOYER',NULL,'2026-06-05 14:08:32','2026-06-05 14:08:32'),(8,'holee@gmail.com','$2a$12$aUvbzdStl/jAuGXjdon5o.CNxjZhc1IJPLCe4nzOxcRLD80QbGKGi','Lee Min Ho','EMPLOYER','/uploads/avatars/avatar_8_1780755404834.png','2026-06-06 14:13:37','2026-06-06 14:16:44'),(9,'deanwin1811@gmail.com','$2a$12$bV2XsakJ3/whQh47nWBFKeCYmeNDlE.iC2Qkeh3Ry84Gel6WCreh.','Dean Winchester','STUDENT',NULL,'2026-06-06 19:07:47','2026-06-06 19:07:47');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-07  2:40:09
