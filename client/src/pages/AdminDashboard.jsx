import React, { useState, useEffect } from 'react';
import { 
  Users, CheckCircle2, XCircle, Send, Download, 
  FileSpreadsheet, Search, RefreshCw, QrCode, Sliders, 
  ExternalLink, Mail, ShieldCheck, Award, ArrowUpRight, 
  Terminal, Sparkles, AlertCircle, BarChart3, Filter, 
  Upload, Image as ImageIcon, Key, Check, HelpCircle, Lock 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundFX } from '../utils/audio';

export default function AdminDashboard({ initialEventId, onOpenTemplateEditor, onLaunchProjector }) {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(initialEventId || '');
  const [registrations, setRegistrations] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [attendanceFilter, setAttendanceFilter] = useState('');
  
  // Certificate Dispatch state & Terminal log simulation
  const [isIssuing, setIsIssuing] = useState(false);
  const [issueSummary, setIssueSummary] = useState(null);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState([]);

  // Template upload state
  const [uploadingTemplate, setUploadingTemplate] = useState(false);
  const [templateFile, setTemplateFile] = useState(null);

  // SMTP Gmail Configuration state
  const [adminEmail, setAdminEmail] = useState('jeshu1161@gmail.com');
  const [adminPassword, setAdminPassword] = useState('');
  const [smtpSaved, setSmtpSaved] = useState(false);
  const [showSmtpSettings, setShowSmtpSettings] = useState(false);
  const [smtpStatus, setSmtpStatus] = useState({ isConfigured: false });

  // 1. Fetch all events & SMTP status
  const fetchAllEvents = async () => {
    try {
      const res = await fetch('/api/events');
      const data = await res.json();
      setEvents(data);
      if (!selectedEventId && data.length > 0) {
        setSelectedEventId(data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSmtpStatus = async () => {
    try {
      const res = await fetch('/api/certificates/smtp-status');
      const data = await res.json();
      setSmtpStatus(data);
      if (data.adminEmail) setAdminEmail(data.adminEmail);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAllEvents();
    fetchSmtpStatus();
  }, []);

  // 2. Fetch registrations & analytics for selected event
  const fetchEventData = async () => {
    if (!selectedEventId) return;
    try {
      setLoading(true);
      const regRes = await fetch(`/api/events/${selectedEventId}/registrations?search=${searchQuery}&attended=${attendanceFilter}`);
      const regData = await regRes.json();
      setRegistrations(regData);

      const analyticsRes = await fetch(`/api/events/${selectedEventId}/analytics`);
      const analyticsData = await analyticsRes.json();
      setAnalytics(analyticsData);
    } catch (err) {
      console.error('Error fetching event data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventData();
  }, [selectedEventId, searchQuery, attendanceFilter]);

  const selectedEvent = events.find(e => e.id === selectedEventId);

  // 3. Handle Compulsory Template Upload (Supports any image format: JPG, JPEG, PNG, WEBP, etc.)
  const handleUploadTemplate = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingTemplate(true);

      // Convert any image format to standard high-quality JPEG Data URI
      let dataUri;
      try {
        dataUri = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onerror = () => reject(new Error('Failed to read file.'));
          reader.onload = () => {
            const img = new Image();
            img.onerror = () => reject(new Error('Selected file is not a valid image format.'));
            img.onload = () => {
              let { width, height } = img;
              const maxDim = 2400;
              if (width > maxDim || height > maxDim) {
                if (width > height) {
                  height = Math.round((height * maxDim) / width);
                  width = maxDim;
                } else {
                  width = Math.round((width * maxDim) / height);
                  height = maxDim;
                }
              }
              const canvas = document.createElement('canvas');
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, width, height);
              ctx.drawImage(img, 0, 0, width, height);
              resolve(canvas.toDataURL('image/jpeg', 0.92));
            };
            img.src = reader.result;
          };
          reader.readAsDataURL(file);
        });
      } catch (convErr) {
        console.warn('Canvas conversion fallback:', convErr);
      }

      let res;
      if (dataUri) {
        res = await fetch(`/api/events/${selectedEventId}/upload-template`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ templateDataUri: dataUri })
        });
      } else {
        const formData = new FormData();
        formData.append('template', file);
        res = await fetch(`/api/events/${selectedEventId}/upload-template`, {
          method: 'POST',
          body: formData
        });
      }

      const data = await res.json();

      if (res.ok) {
        soundFX.playSuccessChime();
        await fetchAllEvents();
        alert('Certificate template uploaded successfully! Ready for 1-click issuance.');
      } else {
        alert(data.error || 'Failed to upload template.');
      }
    } catch (err) {
      alert('Upload error: ' + err.message);
    } finally {
      setUploadingTemplate(false);
      e.target.value = '';
    }
  };

  // 4. Save Gmail SMTP App Password
  const handleSaveSmtp = async (e) => {
    e.preventDefault();
    if (!adminPassword.trim()) {
      alert('Please enter your 16-character Google App Password.');
      return;
    }

    try {
      const res = await fetch('/api/certificates/smtp-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminEmail: adminEmail.trim(),
          adminPassword: adminPassword.trim()
        })
      });
      const data = await res.json();

      if (res.ok) {
        setSmtpSaved(true);
        setSmtpStatus({ isConfigured: true, adminEmail });
        soundFX.playSuccessChime();
        setTimeout(() => setSmtpSaved(false), 4000);
      } else {
        alert(data.error || 'Failed to configure SMTP.');
      }
    } catch (err) {
      alert('SMTP configuration error: ' + err.message);
    }
  };

  // 5. 1-Click Batch Issue Certificates and Send Emails
  const handleBatchIssueCertificates = async (forceResend = false) => {
    // Compulsory check: Template must be uploaded
    if (!selectedEvent?.template_image) {
      alert('⚠️ MANDATORY REQUIREMENT: Please upload the certificate template image for this event first!');
      return;
    }

    try {
      setIsIssuing(true);
      setIssueSummary(null);
      setShowIssueModal(true);
      setTerminalLogs([
        `[INIT] Loading certificate template image: ${selectedEvent.template_image}...`,
        `[SENDER] Outgoing dispatch configured as: ${adminEmail}...`,
        `[QUERY] Fetching confirmed attendees with verified attendance...`
      ]);

      const res = await fetch(`/api/certificates/events/${selectedEventId}/issue-certificates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceResend })
      });

      const data = await res.json();
      setIssueSummary(data);

      if (!res.ok) {
        setTerminalLogs(prev => [...prev, `[ERROR] ${data.error || data.message || 'Operation failed'}`]);
        return;
      }

      if (data.details) {
        const logs = data.details.map(d => 
          `[DISPATCH] Stamped name "${d.student_name}" on template -> Delivered to ${d.email} [${d.status}]`
        );
        setTerminalLogs(prev => [
          ...prev, 
          `[SUCCESS] Processed ${data.successful} verified certificates.`,
          ...logs,
          `[LEDGER] Institutional digital credentials issued successfully.`
        ]);
      }

      if (data.successful > 0) {
        soundFX.playSuccessChime();
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      }
      fetchEventData();
    } catch (err) {
      alert('Error issuing certificates: ' + err.message);
    } finally {
      setIsIssuing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header & Event Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs px-3 py-0.5 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-800 font-bold tracking-wider uppercase flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Coordinator Console (Secured)</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1.5">
            Department Event & Certificate Orchestrator
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Real-time participant oversight, live physical attendance monitoring, and automated verified certificate dispatch.
          </p>
        </div>

        {/* Action Controls: SMTP settings & Event Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowSmtpSettings(!showSmtpSettings)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 border transition-all ${
              smtpStatus.isConfigured 
                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300' 
                : 'bg-amber-950/60 border-amber-800 text-amber-300'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>{smtpStatus.isConfigured ? 'Gmail SMTP Active' : 'Configure Gmail Sender'}</span>
          </button>

          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-sm text-white rounded-xl px-4 py-2 focus:outline-none focus:border-indigo-500 font-semibold shadow-lg"
          >
            {events.map((e) => (
              <option key={e.id} value={e.id}>{e.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Gmail SMTP Configuration Panel */}
      {showSmtpSettings && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2.5">
              <Mail className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">Gmail Sender Configuration</h3>
            </div>
            <button
              onClick={() => setShowSmtpSettings(false)}
              className="text-slate-400 hover:text-white text-xs font-semibold"
            >
              ✕ Close
            </button>
          </div>

          <form onSubmit={handleSaveSmtp} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end text-xs">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Sender Email Address</label>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Google App Password (16 Characters) *</label>
              <input
                type="password"
                placeholder="xxxx xxxx xxxx xxxx"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="submit"
                className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all"
              >
                Save Gmail Connection
              </button>
              {smtpSaved && (
                <span className="text-emerald-400 font-bold flex items-center space-x-1 shrink-0">
                  <Check className="w-4 h-4" />
                  <span>Saved!</span>
                </span>
              )}
            </div>
          </form>

          {/* Quick guide for Google App Password */}
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-[11px] text-slate-400 space-y-1">
            <p className="font-bold text-slate-300">How to get your Google App Password in 30 seconds:</p>
            <p>1. Go to your Google Account (<a href="https://myaccount.google.com/security" target="_blank" rel="noreferrer" className="text-indigo-400 underline">myaccount.google.com/security</a>).</p>
            <p>2. Enable <b>2-Step Verification</b> if not already active.</p>
            <p>3. Search for <b>"App Passwords"</b> (or visit <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="text-indigo-400 underline">myaccount.google.com/apppasswords</a>) $\rightarrow$ Create one named "CertiPulse" $\rightarrow$ Paste the 16-character code above.</p>
          </div>
        </div>
      )}

      {selectedEvent && (
        <>
          {/* STEP 1: COMPULSORY CERTIFICATE TEMPLATE UPLOAD & VERIFICATION */}
          <div className={`rounded-3xl p-6 border-2 transition-all shadow-2xl ${
            selectedEvent.template_image 
              ? 'bg-slate-900/90 border-emerald-500/40' 
              : 'bg-amber-950/20 border-amber-500/60'
          }`}>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center space-x-2">
                  <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    selectedEvent.template_image 
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}>
                    {selectedEvent.template_image ? 'Step 1: Template Active' : 'Step 1: Compulsory Action Required'}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white">
                  {selectedEvent.template_image 
                    ? 'Certificate Template Uploaded & Configured' 
                    : 'Compulsory: Upload Event Certificate Template Image'}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {selectedEvent.template_image 
                    ? 'The application will automatically imprint attendee names, dates, and verification QR codes onto this uploaded template.' 
                    : 'Before issuing certificates, you must upload the official department template image (PNG or JPG from Canva/Photoshop).'}
                </p>
              </div>

              {/* Upload Dropzone / Button */}
              <div className="flex flex-wrap items-center gap-3">
                <label className="cursor-pointer px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]">
                  <Upload className="w-4 h-4" />
                  <span>{selectedEvent.template_image ? 'Replace Template Image' : 'Upload Template Image *'}</span>
                  <input
                    type="file"
                    accept="image/*, .jpg, .jpeg, .png, .webp"
                    className="hidden"
                    onChange={handleUploadTemplate}
                    disabled={uploadingTemplate}
                  />
                </label>

                {selectedEvent.template_image && (
                  <button
                    onClick={() => onOpenTemplateEditor(selectedEvent)}
                    className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center space-x-2 transition-colors"
                  >
                    <Sliders className="w-4 h-4 text-cyan-400" />
                    <span>Fine-Tune Text Coordinates</span>
                  </button>
                )}
              </div>
            </div>

            {/* Template Status / Thumbnail preview if exists */}
            {selectedEvent.template_image && (
              <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                <div className="flex items-center space-x-3 text-emerald-400 font-semibold">
                  <img
                    src={selectedEvent.template_image}
                    alt="Active Certificate Template"
                    className="w-16 h-11 object-cover rounded-lg border border-emerald-500/50 shadow-md shadow-emerald-950"
                  />
                  <div>
                    <span className="flex items-center space-x-1.5 text-white font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Official Certificate Template Active & Ready</span>
                    </span>
                    <p className="text-[11px] text-slate-400 font-normal">
                      Attendee credentials & verifiable QR code will be dynamically imprinted
                    </p>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                  Sender: <b className="text-slate-200">{adminEmail}</b>
                </span>
              </div>
            )}
          </div>

          {/* STEP 2: 1-CLICK ISSUE & DISPATCH RIBBON */}
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 flex flex-wrap items-center justify-between gap-4 shadow-xl">
            <div>
              <span className="text-xs font-bold uppercase text-indigo-400 tracking-wider">Step 2: Automated Dispatch</span>
              <h2 className="text-xl font-bold text-white mt-0.5">{selectedEvent.title}</h2>
              <p className="text-xs text-slate-400">
                Sender: <b className="text-slate-300 font-mono">{adminEmail}</b> • Venue: {selectedEvent.venue}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => onLaunchProjector(selectedEvent)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center space-x-2 transition-all shadow"
              >
                <QrCode className="w-4 h-4 text-cyan-400" />
                <span>Projector QR</span>
              </button>

              <a
                href={`/api/events/${selectedEventId}/export-csv`}
                download
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center space-x-2 transition-all shadow"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Export Attendance CSV</span>
              </a>

              {/* Central Key Feature: 1-CLICK ISSUE CERTIFICATES */}
              <button
                onClick={() => handleBatchIssueCertificates(false)}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white text-xs font-black shadow-xl shadow-indigo-600/30 flex items-center space-x-2 transition-all hover:scale-[1.02]"
              >
                <Send className="w-4 h-4" />
                <span>1-Click Issue & Email All Attendees</span>
              </button>
            </div>
          </div>

          {/* Metric Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl p-5 space-y-1 shadow-lg">
              <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Registered</span>
              <div className="text-3xl font-black text-white">
                {analytics?.attendance?.total || registrations.length}
              </div>
              <span className="text-[11px] text-slate-500 font-medium">Capacity: {selectedEvent.max_capacity}</span>
            </div>

            <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl p-5 space-y-1 shadow-lg">
              <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Verified Attendees</span>
              <div className="text-3xl font-black text-emerald-400">
                {analytics?.attendance?.attended || 0}
              </div>
              <span className="text-[11px] text-emerald-500 font-semibold">
                {analytics?.attendance?.total > 0
                  ? Math.round((analytics.attendance.attended / analytics.attendance.total) * 100)
                  : 0}% physical turnout
              </span>
            </div>

            <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl p-5 space-y-1 shadow-lg">
              <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Certificates Dispatched</span>
              <div className="text-3xl font-black text-cyan-400">
                {registrations.filter(r => r.certificate_sent === 1).length}
              </div>
              <span className="text-[11px] text-cyan-500 font-medium">Delivered to Inbox</span>
            </div>

            <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl p-5 space-y-1 shadow-lg">
              <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Pending Delivery</span>
              <div className="text-3xl font-black text-amber-400">
                {registrations.filter(r => r.attended === 1 && r.certificate_sent === 0).length}
              </div>
              <span className="text-[11px] text-amber-500 font-semibold">Ready for generation</span>
            </div>
          </div>

          {/* Registrations & Attendance Roster Table */}
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl overflow-hidden shadow-2xl space-y-4 p-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-bold text-white">Event Participant Roster</h3>
                <p className="text-xs text-slate-400">Total {registrations.length} registered students</p>
              </div>

              {/* Search & Filter */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search Name / Roll No / Email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <select
                  value={attendanceFilter}
                  onChange={(e) => setAttendanceFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">All Attendance</option>
                  <option value="true">Attended Only</option>
                  <option value="false">Absent Only</option>
                </select>

                <button
                  onClick={fetchEventData}
                  className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                  title="Refresh list"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px] bg-slate-950/60">
                    <th className="py-3 px-4">Roll No</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Email Address</th>
                    <th className="py-3 px-4">Department / Year</th>
                    <th className="py-3 px-4">Attendance</th>
                    <th className="py-3 px-4">Certificate Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-500">Loading registrations...</td>
                    </tr>
                  ) : registrations.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-500">No participants match your query.</td>
                    </tr>
                  ) : (
                    registrations.map((student) => (
                      <tr key={student.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">
                          {student.college_id}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-white">
                          {student.student_name}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 font-mono">
                          {student.email}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-medium text-slate-200">{student.department}</span>
                          <span className="block text-[10px] text-slate-500">{student.year_of_study}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          {student.attended === 1 ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/40 font-semibold">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Attended</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-medium">
                              <XCircle className="w-3 h-3" />
                              <span>Absent</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {student.certificate_sent === 1 ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800/40 font-semibold">
                                <Award className="w-3 h-3" />
                                <span>Delivered</span>
                              </span>
                              <span className="block text-[10px] font-mono text-slate-500">
                                {student.certificate_id}
                              </span>
                            </div>
                          ) : student.attended === 1 ? (
                            <span className="text-amber-400 text-[11px] font-semibold">Ready to Issue</span>
                          ) : (
                            <span className="text-slate-500 text-[11px]">Ineligible</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {student.certificate_id && (
                            <a
                              href={`/api/certificates/${student.certificate_id}/download`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center space-x-1 text-indigo-400 hover:text-indigo-300 font-semibold text-xs bg-indigo-950/60 px-3 py-1.5 rounded-xl border border-indigo-800/50 hover:bg-indigo-900/60 transition-colors shadow"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>PDF</span>
                            </a>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal: Interactive Cyber Console Terminal for Batch Certificate Dispatch */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 sm:p-8 space-y-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center space-x-2">
                <Terminal className="w-6 h-6 text-cyan-400" />
                <h3 className="text-xl font-bold text-white">1-Click Batch Certificate Synthesis Engine</h3>
              </div>
              <button
                onClick={() => setShowIssueModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto space-y-4 flex-1 pr-1">
              {/* Terminal View */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xs space-y-1.5 text-cyan-300 shadow-inner">
                <div className="text-slate-500 pb-1 border-b border-slate-800 flex justify-between">
                  <span>DISPATCH KERNEL v2.5</span>
                  <span className="text-emerald-400">STATUS: {isIssuing ? 'ACTIVE DISPATCH' : 'COMPLETE'}</span>
                </div>
                {terminalLogs.map((log, i) => (
                  <div key={i} className="leading-relaxed">
                    <span className="text-indigo-400">&gt;</span> {log}
                  </div>
                ))}
                {isIssuing && (
                  <div className="flex items-center space-x-2 text-cyan-400 animate-pulse pt-1">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Overlaying attendee names onto uploaded template & dispatching...</span>
                  </div>
                )}
              </div>

              {/* Summary Cards */}
              {issueSummary && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                      <div className="text-xl font-bold text-white">{issueSummary.total || 0}</div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Attendees</div>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border border-emerald-900/50 text-center">
                      <div className="text-xl font-bold text-emerald-400">{issueSummary.successful || 0}</div>
                      <div className="text-[10px] text-emerald-500 uppercase font-semibold">Delivered to Inbox</div>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                      <div className="text-xl font-bold text-rose-400">{issueSummary.failed || 0}</div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Failed</div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 font-bold uppercase tracking-wider">
                    Clickable Live Email & PDF Previews:
                  </p>

                  <div className="space-y-2">
                    {issueSummary.details?.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-bold text-white">{item.student_name}</p>
                          <p className="text-slate-400 font-mono text-[11px]">{item.email}</p>
                          <p className="text-indigo-400 font-mono text-[10px] font-semibold mt-0.5">{item.cert_id}</p>
                        </div>

                        <div className="flex items-center space-x-2">
                          {item.email_preview && (
                            <a
                              href={item.email_preview}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 rounded-xl bg-indigo-950 border border-indigo-800 text-indigo-300 text-xs font-semibold flex items-center space-x-1.5 hover:bg-indigo-900 transition-colors shadow"
                            >
                              <span>Inspect Email & PDF</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                            item.status === 'SUCCESS' 
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                              : 'bg-rose-950 text-rose-400 border border-rose-800'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-between items-center shrink-0">
              <button
                onClick={() => handleBatchIssueCertificates(true)}
                disabled={isIssuing}
                className="text-xs text-slate-400 hover:text-white underline disabled:opacity-50"
              >
                Force Re-Send All Certificates
              </button>

              <button
                onClick={() => setShowIssueModal(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
