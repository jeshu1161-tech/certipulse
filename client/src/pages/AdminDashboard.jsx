import React, { useState, useEffect } from 'react';
import { 
  Users, CheckCircle2, XCircle, Send, Download, 
  FileSpreadsheet, Search, RefreshCw, QrCode, Sliders, 
  ExternalLink, Mail, ShieldCheck, Award, ArrowUpRight, 
  Terminal, Sparkles, AlertCircle, BarChart3, Filter 
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

  // 1. Fetch all events
  useEffect(() => {
    fetch('/api/events')
      .then(res => res.json())
      .then(data => {
        setEvents(data);
        if (!selectedEventId && data.length > 0) {
          setSelectedEventId(data[0].id);
        }
      })
      .catch(console.error);
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

  // 3. Batch Issue Certificates and Send Emails with Cyber Console
  const handleBatchIssueCertificates = async (forceResend = false) => {
    try {
      setIsIssuing(true);
      setIssueSummary(null);
      setShowIssueModal(true);
      setTerminalLogs([
        `[SYSTEM] Initializing institutional cryptographic certificate engine...`,
        `[SYSTEM] Connecting to Department event registry for ID: ${selectedEventId}...`,
        `[VERIFY] Querying confirmed physical attendance roster...`
      ]);

      const res = await fetch(`/api/certificates/events/${selectedEventId}/issue-certificates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceResend })
      });

      const data = await res.json();
      setIssueSummary(data);

      if (data.details) {
        const logs = data.details.map(d => 
          `[DISPATCH] Stamped vector PDF -> ${d.student_name} (${d.cert_id}) -> Delivered to ${d.email} [250 OK]`
        );
        setTerminalLogs(prev => [
          ...prev, 
          `[SUCCESS] Processed ${data.successful} verified certificates.`,
          ...logs,
          `[LEDGER] Institutional audit trail updated.`
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

  const selectedEvent = events.find(e => e.id === selectedEventId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header & Event Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs px-3 py-0.5 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-800 font-bold tracking-wider uppercase flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Coordinator Console</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1.5">
            Department Event & Certificate Orchestrator
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Real-time participant oversight, live physical attendance monitoring, and automated verified certificate dispatch.
          </p>
        </div>

        {/* Event Picker Dropdown */}
        <div className="flex items-center space-x-3">
          <label className="text-xs font-semibold text-slate-400">Select Event:</label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-sm text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 font-semibold shadow-lg"
          >
            {events.map((e) => (
              <option key={e.id} value={e.id}>{e.title}</option>
            ))}
          </select>
        </div>
      </div>

      {selectedEvent && (
        <>
          {/* Action Ribbon & Quick Controls */}
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 flex flex-wrap items-center justify-between gap-4 shadow-xl">
            <div>
              <span className="text-xs font-bold uppercase text-indigo-400 tracking-wider">Active Workspace</span>
              <h2 className="text-xl font-bold text-white mt-0.5">{selectedEvent.title}</h2>
              <p className="text-xs text-slate-400">{selectedEvent.venue} • {selectedEvent.event_date}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => onLaunchProjector(selectedEvent)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center space-x-2 transition-all shadow"
              >
                <QrCode className="w-4 h-4 text-cyan-400" />
                <span>Projector QR Screen</span>
              </button>

              <button
                onClick={() => onOpenTemplateEditor(selectedEvent)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center space-x-2 transition-all shadow"
              >
                <Sliders className="w-4 h-4 text-indigo-400" />
                <span>Template Customizer</span>
              </button>

              <a
                href={`/api/events/${selectedEventId}/export-csv`}
                download
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center space-x-2 transition-all shadow"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Export Attendance CSV</span>
              </a>

              {/* Central Key Feature: Issue Certificates Button */}
              <button
                onClick={() => handleBatchIssueCertificates(false)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white text-xs font-black shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition-all hover:scale-[1.02]"
              >
                <Send className="w-4 h-4" />
                <span>Issue & Email Certificates</span>
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
              <span className="text-[11px] text-cyan-500 font-medium">Delivered with PDF</span>
            </div>

            <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl p-5 space-y-1 shadow-lg">
              <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Pending Delivery</span>
              <div className="text-3xl font-black text-amber-400">
                {registrations.filter(r => r.attended === 1 && r.certificate_sent === 0).length}
              </div>
              <span className="text-[11px] text-amber-500 font-semibold">Ready for generation</span>
            </div>
          </div>

          {/* Department & Year Distribution Widgets */}
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Department breakdown */}
              <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6 space-y-4 shadow-lg">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4 text-indigo-400" />
                  <span>Participant Breakdown by Department</span>
                </h3>
                <div className="space-y-2.5">
                  {analytics.department_breakdown?.map((d, idx) => {
                    const total = analytics.attendance?.total || 1;
                    const pct = Math.round((d.count / total) * 100);
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-300 font-medium">
                          <span className="truncate">{d.department}</span>
                          <span className="font-mono text-indigo-400 font-bold">{d.count} ({pct}%)</span>
                        </div>
                        <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800/80">
                          <div
                            className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Year of study breakdown */}
              <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6 space-y-4 shadow-lg">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  <span>Participant Breakdown by Year</span>
                </h3>
                <div className="space-y-2.5">
                  {analytics.year_breakdown?.map((y, idx) => {
                    const total = analytics.attendance?.total || 1;
                    const pct = Math.round((y.count / total) * 100);
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-300 font-medium">
                          <span>{y.year_of_study}</span>
                          <span className="font-mono text-cyan-400 font-bold">{y.count} ({pct}%)</span>
                        </div>
                        <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800/80">
                          <div
                            className="bg-cyan-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

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
                                <span>Sent</span>
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
                <h3 className="text-xl font-bold text-white">Batch Certificate Synthesis Engine</h3>
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
                  <span>CERTI-PULSE KERNEL v2.4</span>
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
                    <span>Processing vector layouts and SMTP attachments...</span>
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
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
                            DELIVERED
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
