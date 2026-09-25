import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isVercel = Boolean(process.env.VERCEL);
const baseStorageDir = isVercel ? '/tmp' : path.join(__dirname, '..');

const dataDir = path.join(baseStorageDir, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const uploadsDir = path.join(baseStorageDir, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export const certsDir = path.join(baseStorageDir, 'generated_certs');
if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'certipulse.db');
export const db = new DatabaseSync(dbPath);


export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      speaker_name TEXT,
      event_date TEXT NOT NULL,
      event_time TEXT NOT NULL,
      venue TEXT NOT NULL,
      department TEXT NOT NULL,
      max_capacity INTEGER DEFAULT 200,
      template_image TEXT,
      template_config TEXT,
      status TEXT DEFAULT 'UPCOMING',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS registrations (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      student_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone_number TEXT NOT NULL,
      department TEXT NOT NULL,
      year_of_study TEXT NOT NULL,
      college_id TEXT NOT NULL,
      attended INTEGER DEFAULT 0,
      attended_at TEXT,
      certificate_id TEXT UNIQUE,
      certificate_sent INTEGER DEFAULT 0,
      registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE,
      UNIQUE(event_id, email),
      UNIQUE(event_id, college_id)
    );

    CREATE TABLE IF NOT EXISTS attendance_tokens (
      token TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL
    );
  `);

  // Check if we need to seed sample events
  const checkStmt = db.prepare('SELECT COUNT(*) as count FROM events');
  const count = checkStmt.get().count;

  if (count === 0) {
    const defaultTemplateConfig = JSON.stringify({
      name_coords: { x: 421, y: 310, fontSize: 36, color: '#0f172a' },
      event_coords: { x: 421, y: 240, fontSize: 22, color: '#1e293b' },
      date_coords: { x: 260, y: 155, fontSize: 13, color: '#475569' },
      id_coords: { x: 580, y: 155, fontSize: 11, color: '#64748b' },
      qr_coords: { x: 680, y: 70, size: 90 }
    });

    const insertEvent = db.prepare(`
      INSERT INTO events (id, title, description, speaker_name, event_date, event_time, venue, department, max_capacity, template_config, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertEvent.run(
      'evt-web-sec-101',
      'Web Security & Bug Bounty Hands-on Workshop',
      'Learn modern penetration testing techniques, OWASP Top 10 vulnerabilities, live SQL injection labs, and bug bounty hunting methodology on live targets.',
      'Dr. Rajesh Nathan (Senior Security Researcher)',
      '2026-10-15',
      '10:00 AM - 04:00 PM',
      'Cybersecurity Lab 3, Tech Block B',
      'Cybersecurity',
      120,
      defaultTemplateConfig,
      'UPCOMING'
    );

    insertEvent.run(
      'evt-devsecops-202',
      'Cloud Security & DevSecOps CI/CD Masterclass',
      'Practical automated vulnerability scanning, container security with Docker & Kubernetes, SAST/DAST pipelines, and secret detection.',
      'Ms. Priya Sundaram (Cloud Security Architect)',
      '2026-10-22',
      '09:30 AM - 01:30 PM',
      'Auditorium 2 & Hybrid Stream',
      'Cybersecurity',
      250,
      defaultTemplateConfig,
      'UPCOMING'
    );

    insertEvent.run(
      'evt-ai-redteam-303',
      'AI Red Teaming & Prompt Injection Defense Symposium',
      'Deep dive into adversarial machine learning, prompt injection payloads, LLM jailbreaking techniques, and defense-in-depth for generative AI models.',
      'Prof. Anand Chandran (AI Ethics & Sec Lab)',
      '2026-11-05',
      '02:00 PM - 05:00 PM',
      'Seminar Hall 1',
      'Cybersecurity',
      150,
      defaultTemplateConfig,
      'UPCOMING'
    );

    // Seed some sample participants for immediate demo of attendance & certificate generation
    const insertReg = db.prepare(`
      INSERT INTO registrations (id, event_id, student_name, email, phone_number, department, year_of_study, college_id, attended, attended_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertReg.run('reg-1', 'evt-web-sec-101', 'Arjun Sharma', 'arjun.sharma21@college.edu', '9876543210', 'Cybersecurity', '3rd Year', '21CY015', 1, '2026-10-15 10:15:00');
    insertReg.run('reg-2', 'evt-web-sec-101', 'Meera Krishnan', 'meera.k22@college.edu', '9876543211', 'Cybersecurity', '2nd Year', '22CY032', 1, '2026-10-15 10:18:00');
    insertReg.run('reg-3', 'evt-web-sec-101', 'Rohan Varma', 'rohan.cse21@college.edu', '9876543212', 'Computer Science', '3rd Year', '21CS089', 1, '2026-10-15 10:22:00');
    insertReg.run('reg-4', 'evt-web-sec-101', 'Ananya Iyer', 'ananya.it23@college.edu', '9876543213', 'Information Technology', '1st Year', '23IT044', 0, null);
    insertReg.run('reg-5', 'evt-web-sec-101', 'Karthik Raja', 'karthik.aids22@college.edu', '9876543214', 'AI & Data Science', '2nd Year', '22AD019', 1, '2026-10-15 10:25:00');

    console.log('Database seeded with sample events and participants.');
  }
}
