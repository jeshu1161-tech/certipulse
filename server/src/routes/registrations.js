import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

// REGISTER A STUDENT FOR AN EVENT
router.post('/:eventId/register', (req, res) => {
  try {
    const { eventId } = req.params;
    const {
      student_name,
      email,
      phone_number,
      department,
      year_of_study,
      college_id
    } = req.body;

    // 1. Validation
    if (!student_name?.trim() || !email?.trim() || !phone_number?.trim() || !department || !year_of_study || !college_id?.trim()) {
      return res.status(400).json({ error: 'All fields (Name, Email, Phone, Department, Year, College ID) are mandatory.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    // 2. Check if event exists
    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    // 3. Check duplicate registration (email or roll number)
    const existing = db.prepare(`
      SELECT * FROM registrations 
      WHERE event_id = ? AND (LOWER(email) = LOWER(?) OR LOWER(college_id) = LOWER(?))
    `).get(eventId, email.trim(), college_id.trim());

    if (existing) {
      return res.status(409).json({
        error: `A registration with this Email (${email}) or College ID (${college_id}) already exists for this event.`
      });
    }

    // 4. Check capacity
    const regCount = db.prepare('SELECT COUNT(*) as count FROM registrations WHERE event_id = ?').get(eventId).count;
    if (regCount >= event.max_capacity) {
      return res.status(400).json({ error: 'This event has reached maximum capacity.' });
    }

    // 5. Insert registration
    const regId = `reg-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const insertStmt = db.prepare(`
      INSERT INTO registrations (
        id, event_id, student_name, email, phone_number, department, year_of_study, college_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertStmt.run(
      regId,
      eventId,
      student_name.trim(),
      email.trim().toLowerCase(),
      phone_number.trim(),
      department.trim(),
      year_of_study.trim(),
      college_id.trim().toUpperCase()
    );

    const created = db.prepare('SELECT * FROM registrations WHERE id = ?').get(regId);

    res.status(201).json({
      success: true,
      message: 'Registration successful! Your seat is confirmed.',
      registration: created,
      event: {
        title: event.title,
        date: event.event_date,
        venue: event.venue,
        time: event.event_time
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET ALL REGISTRATIONS FOR AN EVENT
router.get('/:eventId/registrations', (req, res) => {
  try {
    const { eventId } = req.params;
    const { search, attended, department } = req.query;

    let query = 'SELECT * FROM registrations WHERE event_id = ?';
    const params = [eventId];

    if (attended !== undefined && attended !== '') {
      query += ' AND attended = ?';
      params.push(attended === 'true' || attended === '1' ? 1 : 0);
    }

    if (department) {
      query += ' AND department = ?';
      params.push(department);
    }

    if (search) {
      query += ' AND (student_name LIKE ? OR email LIKE ? OR college_id LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    query += ' ORDER BY registered_at DESC';

    const list = db.prepare(query).all(...params);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// EXPORT TO CSV
router.get('/:eventId/export-csv', (req, res) => {
  try {
    const { eventId } = req.params;
    const event = db.prepare('SELECT title FROM events WHERE id = ?').get(eventId);
    const list = db.prepare(`
      SELECT 
        college_id,
        student_name,
        email,
        phone_number,
        department,
        year_of_study,
        CASE WHEN attended = 1 THEN 'Attended' ELSE 'Absent' END AS attendance_status,
        attended_at,
        certificate_id,
        CASE WHEN certificate_sent = 1 THEN 'Sent' ELSE 'Not Sent' END AS cert_email_status,
        registered_at
      FROM registrations
      WHERE event_id = ?
      ORDER BY college_id ASC
    `).all(eventId);

    if (list.length === 0) {
      return res.status(404).send('No registrations found for this event.');
    }

    const headers = Object.keys(list[0]).join(',');
    const rows = list.map(item =>
      Object.values(item).map(val => `"${(val || '').toString().replace(/"/g, '""')}"`).join(',')
    );

    const csvContent = [headers, ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${(event?.title || 'event').replace(/[^a-zA-Z0-9]/g, '_')}_attendance.csv"`);
    res.send(csvContent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
