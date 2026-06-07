const nodemailer = require('nodemailer');

const MAIL_PORT = parseInt(process.env.MAIL_PORT || '587');
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: MAIL_PORT,
  secure: MAIL_PORT === 465,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const sendMail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to,
      subject,
      html,
    });
    console.log(`📧 Email sent to ${to}`);
  } catch (err) {
    console.error('Email error:', err.message);
    // Don't throw - email failure shouldn't break the main flow
  }
};

module.exports = {
  // Gửi khi sinh viên apply thành công
  sendApplyConfirmation: (to, studentName, jobTitle, companyName) =>
    sendMail(
      to,
      `✅ Ứng tuyển thành công — ${jobTitle}`,
      `<h2>Xin chào ${studentName}!</h2>
       <p>Bạn đã ứng tuyển thành công vào vị trí <strong>${jobTitle}</strong> tại <strong>${companyName}</strong>.</p>
       <p>Hệ thống sẽ thông báo khi nhà tuyển dụng phản hồi hồ sơ của bạn.</p>
       <p>Chúc bạn may mắn! 🎯</p>
       <p>— LangXiMi</p>`,
    ),

  // Gửi khi hồ sơ được duyệt
  sendApplicationApproved: (to, studentName, jobTitle, companyName, note) =>
    sendMail(
      to,
      `🎉 Hồ sơ của bạn đã được duyệt — ${jobTitle}`,
      `<h2>Chúc mừng ${studentName}!</h2>
       <p>Hồ sơ ứng tuyển vị trí <strong>${jobTitle}</strong> tại <strong>${companyName}</strong> đã được <strong>chấp nhận</strong>.</p>
       ${note ? `<p><em>Nhà tuyển dụng nhắn: ${note}</em></p>` : ''}
       <p>Vui lòng chờ liên hệ từ nhà tuyển dụng để sắp xếp phỏng vấn.</p>
       <p>— LangXiMi</p>`,
    ),

  // Gửi khi hồ sơ bị từ chối
  sendApplicationRejected: (to, studentName, jobTitle, companyName, note) =>
    sendMail(
      to,
      `Cập nhật hồ sơ ứng tuyển — ${jobTitle}`,
      `<h2>Xin chào ${studentName},</h2>
       <p>Rất tiếc, hồ sơ ứng tuyển vị trí <strong>${jobTitle}</strong> tại <strong>${companyName}</strong> chưa phù hợp lần này.</p>
       ${note ? `<p><em>Phản hồi: ${note}</em></p>` : ''}
       <p>Đừng nản lòng! Hãy tiếp tục cập nhật kỹ năng và thử các vị trí khác.</p>
       <p>— LangXiMi</p>`,
    ),
};