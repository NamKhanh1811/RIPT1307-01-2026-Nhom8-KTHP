const https = require('https');

const sendMail = async (to, subject, html) => {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error('RESEND_API_KEY not set');

    const body = JSON.stringify({
      from: 'LangXiMi <onboarding@resend.dev>',
      to: [to],
      subject,
      html,
    });

    await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'api.resend.com',
        path: '/emails',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
          } else {
            reject(new Error(`Resend API error: ${res.statusCode} ${data}`));
          }
        });
      });
      req.on('error', reject);
      req.write(body);
      req.end();
    });

    console.log(`📧 Email sent to ${to}`);
  } catch (err) {
    console.error('Email error:', err.message);
  }
};

module.exports = {
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