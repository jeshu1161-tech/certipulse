import nodemailer from 'nodemailer';

let runtimeSmtpConfig = {
  adminEmail: process.env.ADMIN_EMAIL || 'jeshu1161@gmail.com',
  adminPassword: process.env.ADMIN_EMAIL_PASSWORD || process.env.GMAIL_APP_PASSWORD || ''
};

export function updateAdminSmtpConfig({ adminEmail, adminPassword }) {
  if (adminEmail) runtimeSmtpConfig.adminEmail = adminEmail.trim();
  if (adminPassword) runtimeSmtpConfig.adminPassword = adminPassword.trim().replace(/\s+/g, '');
}

export function getAdminSmtpConfig() {
  return {
    adminEmail: runtimeSmtpConfig.adminEmail,
    isConfigured: Boolean(runtimeSmtpConfig.adminPassword)
  };
}

async function getTransporter() {
  const { adminEmail, adminPassword } = runtimeSmtpConfig;

  // 1. Direct Gmail SMTP with Admin's email address
  if (adminPassword) {
    return {
      transporter: nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: adminEmail,
          pass: adminPassword
        }
      }),
      fromEmail: adminEmail,
      isRealGmail: true
    };
  }

  // 2. Custom SMTP Host if provided in environment
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return {
      transporter: nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      }),
      fromEmail: process.env.SMTP_USER,
      isRealGmail: false
    };
  }

  // 3. Fallback: Ethereal test inbox for development
  const testAccount = await nodemailer.createTestAccount();
  return {
    transporter: nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    }),
    fromEmail: adminEmail,
    isRealGmail: false,
    isTestFallback: true
  };
}

export async function sendCertificateEmail({
  studentEmail,
  studentName,
  eventTitle,
  eventDate,
  certId,
  pdfPath,
  pdfBytes,
  verifyUrl
}) {
  const { transporter, fromEmail, isRealGmail, isTestFallback } = await getTransporter();

  const attachment = {
    filename: `Certificate_${studentName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
    contentType: 'application/pdf'
  };

  if (pdfBytes) {
    attachment.content = Buffer.from(pdfBytes);
  } else if (pdfPath) {
    attachment.path = pdfPath;
  }

  const mailOptions = {
    from: `"Cybersecurity Department" <${fromEmail}>`,
    to: studentEmail,
    replyTo: fromEmail,
    subject: `Official Certificate of Participation: ${eventTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="background-color: #0f172a; padding: 18px; border-radius: 6px; text-align: center;">
          <h2 style="color: #38bdf8; margin: 0; font-size: 20px;">Department of Cybersecurity</h2>
          <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 13px;">Official Academic Credential Verification</p>
        </div>

        <div style="padding: 20px 0;">
          <h3 style="color: #1e293b;">Dear ${studentName},</h3>
          <p style="color: #475569; line-height: 1.6;">
            Congratulations! Your attendance in <b>${eventTitle}</b> on <b>${eventDate}</b> has been verified by the department.
          </p>
          <p style="color: #475569; line-height: 1.6;">
            Your official verifiable participation certificate has been generated and is attached to this email as a high-resolution PDF.
          </p>

          <div style="background: #f8fafc; border-left: 4px solid #6366f1; padding: 12px 16px; margin: 20px 0;">
            <p style="margin: 0; color: #334155; font-size: 14px;"><strong>Credential ID:</strong> ${certId}</p>
            <p style="margin: 4px 0 0 0; color: #334155; font-size: 14px;">
              <strong>Online Verification:</strong> 
              <a href="${verifyUrl}" style="color: #4f46e5; text-decoration: underline;" target="_blank">Verify Online</a>
            </p>
          </div>

          <p style="color: #64748b; font-size: 13px;">
            Issued by: <b>${fromEmail}</b> (Department Coordinator)
          </p>
        </div>

        <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; color: #94a3b8; font-size: 12px; text-align: center;">
          This is an official credential email dispatched by the Department of Cybersecurity.
        </div>
      </div>
    `,
    attachments: [attachment]
  };

  const info = await transporter.sendMail(mailOptions);

  let previewUrl = null;
  if (isTestFallback && typeof nodemailer.getTestMessageUrl === 'function') {
    previewUrl = nodemailer.getTestMessageUrl(info);
  }

  return {
    messageId: info.messageId,
    previewUrl,
    fromEmail,
    isRealGmail
  };
}
