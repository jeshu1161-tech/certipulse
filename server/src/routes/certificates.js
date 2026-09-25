import { Router } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { db, uploadsDir, certsDir } from '../db.js';
import { generateCertificate } from '../services/certGenerator.js';
import { sendCertificateEmail, updateAdminSmtpConfig, getAdminSmtpConfig } from '../services/emailService.js';

const router = Router();

// GET SMTP / SENDER CONFIGURATION STATUS
router.get('/smtp-status', (req, res) => {
  res.json(getAdminSmtpConfig());
});

// UPDATE ADMIN GMAIL APP PASSWORD CONFIGURATION
router.post('/smtp-config', (req, res) => {
  const { adminEmail, adminPassword } = req.body;
  if (!adminPassword?.trim()) {
    return res.status(400).json({ error: 'Please enter your 16-character Google App Password.' });
  }

  updateAdminSmtpConfig({ adminEmail, adminPassword });
  res.json({
    success: true,
    message: `Sender email configured as ${adminEmail || 'jeshu1161@gmail.com'}. Real emails will now be dispatched directly via Gmail SMTP!`
  });
});

// BATCH ISSUE CERTIFICATES & SEND EMAILS TO ALL ATTENDEES
router.post('/events/:eventId/issue-certificates', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { forceResend, bypassTemplateCheck } = req.body || {};

    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    // COMPULSORY: Admin MUST upload a certificate template for this event
    if (!event.template_image && !bypassTemplateCheck) {
      return res.status(400).json({
        error: 'Compulsory Requirement: Please upload the official certificate template image first before issuing certificates to participants.'
      });
    }

    // Fetch verified attendees
    let query = 'SELECT * FROM registrations WHERE event_id = ? AND attended = 1';
    if (!forceResend) {
      query += ' AND certificate_sent = 0';
    }
    const attendees = db.prepare(query).all(eventId);

    if (attendees.length === 0) {
      return res.status(400).json({
        message: 'No pending attendees found to issue certificates to. (Check if attendance has been marked, or enable Force Resend).'
      });
    }

    const templatePath = event.template_image || null;

    const results = [];
    const clientBaseUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    for (const student of attendees) {
      try {
        const certId = student.certificate_id || `CERT-CYBER-${new Date().getFullYear()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

        // 1. Generate PDF Certificate with student name and verification QR code
        const { filePath, pdfBytes } = await generateCertificate({
          studentName: student.student_name,
          eventTitle: event.title,
          eventDate: event.event_date,
          department: event.department,
          certId,
          templatePath,
          templateConfig: event.template_config,
          verifyBaseUrl: `${clientBaseUrl}/verify`
        });

        // 2. Dispatch Email with PDF attachment from Admin's Gmail
        const emailResult = await sendCertificateEmail({
          studentEmail: student.email,
          studentName: student.student_name,
          eventTitle: event.title,
          eventDate: event.event_date,
          certId,
          pdfPath: filePath,
          pdfBytes,
          verifyUrl: `${clientBaseUrl}/verify/${certId}`
        });

        // 3. Update DB
        db.prepare(`
          UPDATE registrations 
          SET certificate_id = ?, certificate_sent = 1 
          WHERE id = ?
        `).run(certId, student.id);

        results.push({
          student_name: student.student_name,
          email: student.email,
          cert_id: certId,
          status: 'SUCCESS',
          sender: emailResult.fromEmail,
          is_real_gmail: emailResult.isRealGmail,
          email_preview: emailResult.previewUrl
        });
      } catch (err) {
        console.error(`Failed to generate/send certificate for ${student.email}:`, err);
        results.push({
          student_name: student.student_name,
          email: student.email,
          status: 'FAILED',
          error: err.message
        });
      }
    }

    res.json({
      success: true,
      message: `Processed ${results.filter(r => r.status === 'SUCCESS').length} of ${attendees.length} certificates.`,
      total: attendees.length,
      successful: results.filter(r => r.status === 'SUCCESS').length,
      failed: results.filter(r => r.status === 'FAILED').length,
      details: results
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUBLIC VERIFICATION ENDPOINT
router.get('/verify/:certId', (req, res) => {
  try {
    const { certId } = req.params;

    const cert = db.prepare(`
      SELECT 
        r.certificate_id,
        r.student_name,
        r.college_id,
        r.department as student_department,
        r.year_of_study,
        r.attended_at,
        e.id as event_id,
        e.title as event_title,
        e.event_date,
        e.venue,
        e.department as host_department,
        e.speaker_name
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      WHERE r.certificate_id = ?
    `).get(certId);

    if (!cert) {
      return res.status(404).json({
        valid: false,
        message: 'Certificate credential could not be verified. Invalid or nonexistent Certificate ID.'
      });
    }

    res.json({
      valid: true,
      certificate: cert,
      verification_status: 'OFFICIALLY VERIFIED & GENUINE',
      verification_timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DOWNLOAD CERTIFICATE PDF
router.get('/:certId/download', async (req, res) => {
  try {
    const { certId } = req.params;
    const certPath = path.join(certsDir, `${certId}.pdf`);

    if (fs.existsSync(certPath)) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${certId}.pdf"`);
      return res.sendFile(certPath);
    }

    // On-demand regeneration for serverless permanence!
    const row = db.prepare(`
      SELECT r.student_name, r.certificate_id, e.title as event_title, e.event_date, e.department, e.template_image, e.template_config
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      WHERE r.certificate_id = ?
    `).get(certId);

    if (!row) {
      return res.status(404).json({ error: 'Certificate credential not found.' });
    }

    const clientBaseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const { pdfBytes } = await generateCertificate({
      studentName: row.student_name,
      eventTitle: row.event_title,
      eventDate: row.event_date,
      department: row.department,
      certId: row.certificate_id,
      templatePath: row.template_image || null,
      templateConfig: row.template_config,
      verifyBaseUrl: `${clientBaseUrl}/verify`
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${certId}.pdf"`);
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
