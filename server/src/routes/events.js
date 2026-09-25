import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `template-${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (.png, .jpg, .jpeg) are supported for templates.'));
    }
  }
});

const router = Router();

// GET all events with registration count & attended count
router.get('/', (req, res) => {
  try {
    const events = db.prepare(`
      SELECT 
        e.*,
        COUNT(r.id) AS total_registrations,
        SUM(CASE WHEN r.attended = 1 THEN 1 ELSE 0 END) AS total_attended,
        SUM(CASE WHEN r.certificate_sent = 1 THEN 1 ELSE 0 END) AS total_certs_sent
      FROM events e
      LEFT JOIN registrations r ON e.id = r.event_id
      GROUP BY e.id
      ORDER BY e.event_date ASC
    `).all();

    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single event by ID
router.get('/:id', (req, res) => {
  try {
    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const stats = db.prepare(`
      SELECT 
        COUNT(id) AS total_registrations,
        SUM(CASE WHEN attended = 1 THEN 1 ELSE 0 END) AS total_attended,
        SUM(CASE WHEN certificate_sent = 1 THEN 1 ELSE 0 END) AS total_certs_sent
      FROM registrations
      WHERE event_id = ?
    `).get(req.params.id);

    res.json({ ...event, stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE new event
router.post('/', (req, res) => {
  try {
    const {
      title,
      description,
      speaker_name,
      event_date,
      event_time,
      venue,
      department,
      max_capacity
    } = req.body;

    if (!title || !event_date || !venue) {
      return res.status(400).json({ error: 'Title, Date, and Venue are required.' });
    }

    const id = `evt-${Date.now().toString(36)}`;
    const defaultTemplateConfig = JSON.stringify({
      name_coords: { x: 421, y: 310, fontSize: 34, color: '#0f172a' },
      event_coords: { x: 421, y: 240, fontSize: 20, color: '#1e293b' },
      date_coords: { x: 230, y: 155, fontSize: 13, color: '#475569' },
      id_coords: { x: 610, y: 155, fontSize: 11, color: '#64748b' },
      qr_coords: { x: 700, y: 70, size: 85 }
    });

    const stmt = db.prepare(`
      INSERT INTO events (id, title, description, speaker_name, event_date, event_time, venue, department, max_capacity, template_config, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'UPCOMING')
    `);

    stmt.run(
      id,
      title,
      description || '',
      speaker_name || '',
      event_date,
      event_time || '10:00 AM',
      venue,
      department || 'Cybersecurity',
      max_capacity || 200,
      defaultTemplateConfig
    );

    const created = db.prepare('SELECT * FROM events WHERE id = ?').get(id);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE template config coordinates
router.put('/:id/template', (req, res) => {
  try {
    const { template_config } = req.body;
    const configStr = typeof template_config === 'object' ? JSON.stringify(template_config) : template_config;

    const stmt = db.prepare('UPDATE events SET template_config = ? WHERE id = ?');
    stmt.run(configStr, req.params.id);

    res.json({ success: true, message: 'Template configuration updated.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPLOAD custom certificate background image
router.post('/:id/upload-template', upload.single('template'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    const templatePath = `/uploads/${req.file.filename}`;
    const stmt = db.prepare('UPDATE events SET template_image = ? WHERE id = ?');
    stmt.run(templatePath, req.params.id);

    res.json({
      success: true,
      template_image: templatePath,
      message: 'Certificate template uploaded successfully'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET department and year analytics for an event
router.get('/:id/analytics', (req, res) => {
  try {
    const deptStats = db.prepare(`
      SELECT department, COUNT(*) as count 
      FROM registrations 
      WHERE event_id = ? 
      GROUP BY department
    `).all(req.params.id);

    const yearStats = db.prepare(`
      SELECT year_of_study, COUNT(*) as count 
      FROM registrations 
      WHERE event_id = ? 
      GROUP BY year_of_study
    `).all(req.params.id);

    const attendanceRate = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN attended = 1 THEN 1 ELSE 0 END) as attended
      FROM registrations
      WHERE event_id = ?
    `).get(req.params.id);

    res.json({
      department_breakdown: deptStats,
      year_breakdown: yearStats,
      attendance: attendanceRate
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
