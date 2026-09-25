import { Router } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { db } from '../db.js';
import { generateCertificate } from '../services/certGenerator.js';
import { sendCertificateEmail } from '../services/emailService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const certsDir = path.join(__dirname, '..', '..', 'generated_certs');
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');

const router = Router();

// BATCH ISSUE CERTIFICATES & SEND EMAILS TO ALL ATTENDEES
router.post('/events/:eventId/issue-certificates', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { forceResend } = req.body || {};

    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });

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

    const templatePath = event.template_image 
      ? path.join(uploadsDir, path.basename(event.template_image)) 
      : null;

    const results = [];
    const clientBaseUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    for (const student of attendees) {
      try {
        // Reuse existing cert ID or generate a new one
        const certId = student.certificate_id || `CERT-CYBER-${new Date().getFullYear()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

        // 1. Generate PDF Certificate
        const { filePath } = await generateCertificate({
          studentName: student.student_name,
          eventTitle: event.title,
          eventDate: event.event_date,
          department: event.department,
          certId,
          templatePath,
          templateConfig: event.template_config,
          verifyBaseUrl: `${clientBaseUrl}/verify`
        });

        // 2. Dispatch Email with PDF attachment
        const emailResult = await sendCertificateEmail({
          studentEmail: student.email,
          studentName: student.student_name,
          eventTitle: event.title,
          eventDate: event.event_date,
          certId,
          pdfPath: filePath,
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
      message: `Successfully processed ${results.filter(r => r.status === 'SUCCESS').length} of ${attendees.length} certificates.`,
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
router.get('/:certId/download', (req, res) => {
  try {
    const { certId } = req.params;
    const certPath = path.join(certsDir, `${certId}.pdf`);

    if (!fs.existsSync(certPath)) {
      return res.status(404).json({ error: 'Certificate file not found on server.' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${certId}.pdf"`);
    res.sendFile(certPath);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
