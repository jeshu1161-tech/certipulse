import { Router } from 'express';
import crypto from 'node:crypto';
import { db } from '../db.js';

const router = Router();

// GENERATE DYNAMIC ROTATING QR TOKEN (Refreshes every 8-10 seconds)
router.get('/:eventId/qr-token', (req, res) => {
  try {
    const { eventId } = req.params;
    const now = Date.now();
    const tokenValidityMs = 12000; // 12 seconds validity window to allow scan and network latency

    // Clean up expired tokens
    db.prepare('DELETE FROM attendance_tokens WHERE expires_at < ?').run(now);

    const token = crypto.randomBytes(16).toString('hex');
    const expiresAt = now + tokenValidityMs;

    db.prepare('INSERT INTO attendance_tokens (token, event_id, expires_at) VALUES (?, ?, ?)').run(
      token,
      eventId,
      expiresAt
    );

    // Build the payload URL that student phone will open upon scanning
    const host = req.get('host') || 'localhost:5000';
    const protocol = req.protocol || 'http';
    const clientBaseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const checkInUrl = `${clientBaseUrl}/check-in?eventId=${eventId}&token=${token}`;

    res.json({
      token,
      expires_in_seconds: 10,
      expires_at: expiresAt,
      check_in_url: checkInUrl
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// STUDENT CHECK-IN HANDLER
router.post('/:eventId/check-in', (req, res) => {
  try {
    const { eventId } = req.params;
    const { token, identifier } = req.body; // identifier = college_id or email

    if (!token || !identifier?.trim()) {
      return res.status(400).json({ error: 'Missing security token or Student Roll No/Email.' });
    }

    const now = Date.now();

    // 1. Verify dynamic token exists and has not expired
    const validToken = db.prepare(`
      SELECT * FROM attendance_tokens 
      WHERE token = ? AND event_id = ? AND expires_at >= ?
    `).get(token, eventId, now);

    if (!validToken) {
      return res.status(400).json({
        error: 'Security Token Expired! The projector QR code rotates every 10 seconds. Please scan the current live QR code on the screen.'
      });
    }

    // 2. Find registration by college_id or email
    const reg = db.prepare(`
      SELECT * FROM registrations 
      WHERE event_id = ? AND (LOWER(email) = LOWER(?) OR LOWER(college_id) = LOWER(?))
    `).get(eventId, identifier.trim(), identifier.trim());

    if (!reg) {
      return res.status(404).json({
        error: `No registration found for "${identifier}". Please verify your Roll Number or Email, or register first.`
      });
    }

    // 3. Check if already checked in
    if (reg.attended === 1) {
      return res.json({
        success: true,
        already_attended: true,
        message: `Welcome back, ${reg.student_name}! Your attendance was already recorded at ${reg.attended_at}.`,
        student: {
          name: reg.student_name,
          college_id: reg.college_id,
          department: reg.department
        }
      });
    }

    // 4. Mark attendance
    const attendedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);
    db.prepare('UPDATE registrations SET attended = 1, attended_at = ? WHERE id = ?').run(
      attendedAt,
      reg.id
    );

    res.json({
      success: true,
      already_attended: false,
      message: `Verified! Attendance recorded for ${reg.student_name} (${reg.college_id}).`,
      student: {
        name: reg.student_name,
        college_id: reg.college_id,
        department: reg.department,
        year: reg.year_of_study,
        attended_at: attendedAt
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LIVE ATTENDANCE STREAM / STATUS FOR PROJECTOR TICKER
router.get('/:eventId/live-turnout', (req, res) => {
  try {
    const { eventId } = req.params;

    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_registered,
        SUM(CASE WHEN attended = 1 THEN 1 ELSE 0 END) as total_attended
      FROM registrations 
      WHERE event_id = ?
    `).get(eventId);

    const recent = db.prepare(`
      SELECT student_name, college_id, department, attended_at
      FROM registrations 
      WHERE event_id = ? AND attended = 1
      ORDER BY attended_at DESC
      LIMIT 8
    `).all(eventId);

    res.json({
      total_registered: stats.total_registered || 0,
      total_attended: stats.total_attended || 0,
      turnout_percentage: stats.total_registered > 0 
        ? Math.round((stats.total_attended / stats.total_registered) * 100) 
        : 0,
      recent_attendees: recent
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
