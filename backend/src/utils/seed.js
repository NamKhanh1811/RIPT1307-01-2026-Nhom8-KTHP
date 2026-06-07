/**
 * Seed script — npm run seed
 */
const bcrypt = require('bcryptjs');
require('dotenv').config();
const db = require('../config/database');

async function seed() {
  console.log('Seeding database...');
  const hash = await bcrypt.hash('123456', 10);

  await db.query('SET FOREIGN_KEY_CHECKS = 0');
  for (const t of ['notifications','applications','cv_skills','experiences','cv_profiles','job_skills','jobs','companies','users']) {
    await db.query(`TRUNCATE TABLE ${t}`);
  }
  await db.query('SET FOREIGN_KEY_CHECKS = 1');

  const [uS1] = await db.query("INSERT INTO users (email,password,full_name,role) VALUES ('student@test.com',?,'Nguyen Minh Khoa','STUDENT')",[hash]);
  const [uS2] = await db.query("INSERT INTO users (email,password,full_name,role) VALUES ('student2@test.com',?,'Tran Thi Hoa','STUDENT')",[hash]);
  const [uE1] = await db.query("INSERT INTO users (email,password,full_name,role) VALUES ('employer@test.com',?,'Pham Thi Mai','EMPLOYER')",[hash]);
  const [uE2] = await db.query("INSERT INTO users (email,password,full_name,role) VALUES ('employer2@test.com',?,'Le Van Hung','EMPLOYER')",[hash]);
  const [uA]  = await db.query("INSERT INTO users (email,password,full_name,role) VALUES ('admin@test.com',?,'Admin InternHub','ADMIN')",[hash]);

  const [c1] = await db.query("INSERT INTO companies(user_id,name,industry,verified)VALUES(?,'FPT Software','IT',1)",[uE1.insertId]);
  const [c2] = await db.query("INSERT INTO companies(user_id,name,industry,verified)VALUES(?,'VNG Corporation','IT',1)",[uE2.insertId]);

  const jobData = [
    [c1.insertId,'Frontend Developer Intern','Xay dung giao dien web voi React va TypeScript','IT','INTERNSHIP',5e6,8e6,'Ha Noi',1,'APPROVED',['React','TypeScript','Ant Design','Git']],
    [c1.insertId,'Backend Java Developer','Phat trien API RESTful voi Spring Boot','IT','FULL_TIME',15e6,25e6,'Ha Noi',0,'APPROVED',['Java','Spring Boot','MySQL','Docker']],
    [c2.insertId,'AI/ML Engineer Intern','Nghien cuu Machine Learning cho san pham Zalo','IT','INTERNSHIP',6e6,10e6,'TP. HCM',1,'APPROVED',['Python','Machine Learning','TensorFlow','SQL']],
    [c2.insertId,'Marketing Executive','Len ke hoach chien dich digital marketing','MARKETING','FULL_TIME',12e6,18e6,'TP. HCM',0,'APPROVED',['Excel','Power BI','Figma']],
    [c1.insertId,'DevOps Engineer','Quan ly ha tang cloud CI/CD tren AWS','IT','FULL_TIME',20e6,35e6,'Ha Noi',1,'PENDING',['Docker','Kubernetes','CI/CD','Git']],
  ];
  const jobIds = [];
  for (const [cid,title,desc,ind,type,smin,smax,loc,remote,status,skills] of jobData) {
    const [j] = await db.query(
      `INSERT INTO jobs(company_id,title,description,industry,type,salary_min,salary_max,location,remote,deadline,status)
       VALUES(?,?,?,?,?,?,?,?,?,DATE_ADD(NOW(),INTERVAL 30 DAY),?)`,
      [cid,title,desc,ind,type,smin,smax,loc,remote,status]);
    jobIds.push(j.insertId);
    if (skills.length) await db.query('INSERT INTO job_skills(job_id,skill_name)VALUES?',[skills.map(s=>[j.insertId,s])]);
  }

  const [cv1] = await db.query(
    "INSERT INTO cv_profiles(user_id,headline,university,major,gpa)VALUES(?,'Frontend Developer Intern','DH Bach Khoa Ha Noi','CNTT',3.5)",[uS1.insertId]);
  await db.query('INSERT INTO cv_skills(cv_id,skill_name)VALUES?',[[[cv1.insertId,'React'],[cv1.insertId,'TypeScript'],[cv1.insertId,'JavaScript'],[cv1.insertId,'Git'],[cv1.insertId,'Ant Design']]]);
  await db.query('INSERT INTO experiences(cv_id,company,position,description,current)VALUES(?,?,?,?,1)',[cv1.insertId,'CLB CNTT Truong','Thanh vien lap trinh','Phat trien web app dung React va Node.js']);

  const [cv2] = await db.query(
    "INSERT INTO cv_profiles(user_id,headline,university,major,gpa)VALUES(?,'Backend Developer','DH Cong nghe HN','CNTT',3.2)",[uS2.insertId]);
  await db.query('INSERT INTO cv_skills(cv_id,skill_name)VALUES?',[[[cv2.insertId,'Java'],[cv2.insertId,'Spring Boot'],[cv2.insertId,'MySQL']]]);

  await db.query("INSERT INTO applications(user_id,job_id,match_score,status)VALUES(?,?,92,'PENDING')",[uS1.insertId,jobIds[0]]);
  await db.query("INSERT INTO applications(user_id,job_id,match_score,status)VALUES(?,?,74,'APPROVED')",[uS2.insertId,jobIds[1]]);
  await db.query("INSERT INTO applications(user_id,job_id,match_score,status)VALUES(?,?,45,'REJECTED')",[uS1.insertId,jobIds[2]]);

  await db.query("INSERT INTO notifications(user_id,type,title,message)VALUES(?,'APPLY_SUCCESS','Ung tuyen thanh cong!','Ban da ung tuyen vi tri Frontend tại FPT Software')",[uS1.insertId]);
  await db.query("INSERT INTO notifications(user_id,type,title,message)VALUES(?,'APPLICATION_APPROVED','Ho so duoc duyet!','Chuc mung! Ho so cua ban tai VNG da duoc chap nhan')",[uS2.insertId]);

  console.log('\nSeed xong!');
  console.log('student@test.com   / 123456');
  console.log('student2@test.com  / 123456');
  console.log('employer@test.com  / 123456 (FPT)');
  console.log('employer2@test.com / 123456 (VNG)');
  console.log('admin@test.com     / 123456');
  process.exit(0);
}

seed().catch(e=>{console.error(e);process.exit(1);});
