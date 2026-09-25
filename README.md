# CertiPulse: Department Event, Workshop & Verifiable Certificate Portal

> **Designed for College Academic & Cybersecurity Departments**  
> An automated, end-to-end event management system featuring anti-proxy dynamic QR attendance, custom certificate layout design, and automated batch PDF certificate generation & email delivery.

---

## 🌟 Key Features

1. **Student Event Registration**
   - Collects **Full Name**, **Department**, **Year of Study**, **Email Address**, **Phone Number**, and **College Roll ID**.
   - Built-in validation prevents duplicate registrations using the same Email or Roll Number.
   - Instant digital ticket pass generation with festive celebratory animations.

2. **Anti-Proxy Dynamic QR Attendance Sentinel**
   - Fullscreen **Projector Mode** designed for lecture halls and seminar auditoriums.
   - The QR code **dynamically rotates every 10 seconds** with time-stamped HMAC cryptographic tokens, preventing students from taking photos or sharing attendance on WhatsApp.
   - Live turnout ticker updates in real time as students scan and check in.

3. **High-Performance Certificate Generation Engine**
   - Generates crisp, vector-quality PDF certificates using `pdf-lib` and `qrcode` in milliseconds.
   - Embeds a unique **Credential ID** (`CERT-CYBER-2026-XXXXX`) and an **Official Verification QR Code**.
   - Includes an elegant built-in academic heraldry design or allows administrators to upload custom pre-designed college templates.

4. **Visual Certificate Template Customizer**
   - Upload any `.png` or `.jpg` certificate template.
   - Real-time visual canvas with interactive sliders to adjust coordinate placements for Name, Event Title, Date, and QR code.

5. **Automated Batch Email Dispatch**
   - Delivers personalized emails with attached PDF certificates directly to each verified attendee's registered email address using **Nodemailer**.
   - Zero-configuration test email sandbox integration via Ethereal Mail with clickable preview URLs.

6. **Public Credential Verification Portal**
   - Anyone (recruiters, companies, students) who scans the certificate's QR code or visits `/verify/:certId` lands on an official institutional verification badge confirming authenticity.

7. **One-Click Accreditation Export**
   - Export official attendance logs to `.csv` with one click for department NBA/NAAC audit compliance.

---

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Lucide Icons, Canvas Confetti.
- **Backend:** Node.js, Express.js.
- **Database:** Relational SQLite via built-in `node:sqlite` (zero external DB installation required).
- **Engines:** `pdf-lib` (Vector PDF synthesis), `qrcode` (dynamic QR generation), `nodemailer` (SMTP delivery).

---

## 🚀 Quick Start Guide

### 1. Start Both Services via Batch Script (Windows)
Double-click `start.bat` in the root folder, or run:
```powershell
.\start.bat
```

### 2. Or Start Services Manually

**Start the Backend API:**
```powershell
cd server
node src/server.js
```
*Backend runs on: `http://localhost:5000`*

**Start the Frontend App:**
```powershell
cd client
npm run dev
```
*Frontend runs on: `http://localhost:5173`*

---

## 🧪 Live Demonstration Workflow for Evaluators

1. **Browse Events:** Open `http://localhost:5173` and see upcoming department workshops.
2. **Register a Student:** Click **Register for Event** on any workshop. Fill in the student's name, department, year, email, phone number, and roll ID.
3. **Launch Projector QR:** Click **Projector QR** to view the live rotating attendance screen. Watch the 10-second countdown timer and rotating tokens.
4. **Student Check-In:** Click the simulation link or open **Student Check-In**, enter the roll number, and confirm attendance. Notice the live ticker on the projector update immediately!
5. **Issue Certificates:** Go to the **Admin Portal**, click **"Issue & Email Certificates"**. Watch the backend batch-stamp the PDFs and dispatch emails with live preview links.
6. **Verify Credential:** Visit the **Verify Certificate** tab or enter any issued Certificate ID to view the official verified digital credential badge.
