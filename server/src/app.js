import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { initDatabase, uploadsDir, certsDir } from './db.js';

import eventsRouter from './routes/events.js';
import registrationsRouter from './routes/registrations.js';
import attendanceRouter from './routes/attendance.js';
import certificatesRouter from './routes/certificates.js';

dotenv.config();

// Ensure DB is initialized
initDatabase();

export const app = express();

app.use(cors());
app.use(express.json());

// Serve static uploaded templates & generated certificates
app.use('/uploads', express.static(uploadsDir));
app.use('/certificates', express.static(certsDir));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'CertiPulse API',
    department: 'Cybersecurity',
    environment: process.env.VERCEL ? 'Vercel Serverless' : 'Local Node.js',
    time: new Date().toISOString()
  });
});

// API Routes
app.use('/api/events', eventsRouter);
app.use('/api/events', registrationsRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/certificates', certificatesRouter);

export default app;
