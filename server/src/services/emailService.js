import nodemailer from 'nodemailer';
import fs from 'node:fs';

let transporterPromise = null;

async function getTransporter() {
  if (transporterPromise) return transporterPromise;

  transporterPromise = (async () => {
    // If user provided custom SMTP in environment
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    }

    // Default: create an ethereal test account for zero-config demonstration
    try {
      const testAccount = await nodemailer.createTestAccount();
      console.log('Using Ethereal Mailer for demo email dispatch:');
      console.log(`Account: ${testAccount.user}`);

      return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
    } catch (err) {
      console.warn('Could not initialize ethereal account, using mock transport fallback', err.message);
      return {
        sendMail: async (opts) => {
          console.log(`[Mock Email Sent] To: ${opts.to}, Subject: ${opts.subject}`);
          return { messageId: 'mock-' + Date.now() };
        }
      };
    }
  })();

  return transporterPromise;
}

export async function sendCertificateEmail({
  studentEmail,
  studentName,
  eventTitle,
  eventDate,
  certId,
  pdfPath,
  verifyUrl
}) {
  const transporter = await getTransporter();

  const mailOptions = {
    from: '"Cybersecurity Dept" <events.cyber@college.edu>',
    to: studentEmail,
    subject: `Your Certificate of Participation: ${eventTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="background-color: #0f172a; padding: 16px; border-radius: 6px; text-align: center;">
          <h2 style="color: #38bdf8; margin: 0; font-size: 20px;">Department of Cybersecurity</h2>
          <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 13px;">College of Engineering & Technology</p>
        </div>

        <div style="padding: 20px 0;">
          <h3 style="color: #1e293b;">Dear ${studentName},</h3>
          <p style="color: #475569; line-height: 1.6;">
            Congratulations! Your attendance and participation in <b>${eventTitle}</b> held on <b>${eventDate}</b> has been successfully verified.
          </p>
          <p style="color: #475569; line-height: 1.6;">
            Your official verifiable digital certificate is attached to this email as a high-resolution PDF.
          </p>

          <div style="background: #f8fafc; border-left: 4px solid #6366f1; padding: 12px 16px; margin: 20px 0;">
            <p style="margin: 0; color: #334155; font-size: 14px;"><strong>Credential ID:</strong> ${certId}</p>
            <p style="margin: 4px 0 0 0; color: #334155; font-size: 14px;">
              <strong>Public Verification Link:</strong> 
              <a href="${verifyUrl}" style="color: #4f46e5; text-decoration: underline;" target="_blank">Verify Online</a>
            </p>
          </div>

          <p style="color: #64748b; font-size: 13px;">
            You can showcase this credential on LinkedIn or attach it to your resume. Anyone can scan the embedded QR code to verify its authenticity instantly.
          </p>
        </div>

        <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; color: #94a3b8; font-size: 12px; text-align: center;">
          This is an automated system email from CertiPulse. Please do not reply directly to this email.
        </div>
      </div>
    `,
    attachments: [
      {
        filename: `Certificate_${studentName.replace(/[^a-zA-Z0-9]/g, '_')}_${certId}.pdf`,
        path: pdfPath,
        contentType: 'application/pdf'
      }
    ]
  };

  const info = await transporter.sendMail(mailOptions);
  let previewUrl = null;
  if (typeof nodemailer.getTestMessageUrl === 'function') {
    previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[Certificate Email Sent] Preview URL: ${previewUrl}`);
    }
  }

  return {
    messageId: info.messageId,
    previewUrl
  };
}
