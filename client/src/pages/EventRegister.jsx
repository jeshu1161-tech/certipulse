import React, { useState } from 'react';
import { 
  User, Mail, Phone, GraduationCap, Building2, 
  IdCard, CheckCircle2, ArrowLeft, AlertCircle, Calendar, MapPin, Clock 
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function EventRegister({ event, onBack, onGoToCheckIn }) {
  const [formData, setFormData] = useState({
    student_name: '',
    email: '',
    phone_number: '',
    department: 'Cybersecurity',
    year_of_study: '3rd Year',
    college_id: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);

  const departments = [
    'Cybersecurity',
    'Computer Science & Engineering (CSE)',
    'Information Technology (IT)',
    'Artificial Intelligence & Data Science (AI & DS)',
    'Electronics & Communication Engineering (ECE)',
    'Electrical & Electronics Engineering (EEE)',
    'Mechanical Engineering',
    'Civil Engineering'
  ];

  const years = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'PG / Masters'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Phone validation
    const phoneClean = formData.phone_number.replace(/\D/g, '');
    if (phoneClean.length < 10) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/events/${event.id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to complete registration.');
        return;
      }

      setSuccessData(data);
      // Trigger festive celebration
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (err) {
      setError('Network connection error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center space-x-2 text-sm text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Events</span>
      </button>

      {/* Main card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        {/* Event Header Banner */}
        <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 p-6 sm:p-8 border-b border-slate-800">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold mb-3">
            <span>Official Event Registration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
            {event.title}
          </h1>

          <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-300">
            <div className="flex items-center space-x-1.5 bg-slate-950/40 px-3 py-1.5 rounded-lg border border-slate-800">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>{event.event_date}</span>
            </div>
            <div className="flex items-center space-x-1.5 bg-slate-950/40 px-3 py-1.5 rounded-lg border border-slate-800">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{event.event_time}</span>
            </div>
            <div className="flex items-center space-x-1.5 bg-slate-950/40 px-3 py-1.5 rounded-lg border border-slate-800">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              <span>{event.venue}</span>
            </div>
          </div>
        </div>

        {/* Content Body: Form OR Success Ticket */}
        <div className="p-6 sm:p-10">
          {successData ? (
            /* Registration Pass / Ticket */
            <div className="max-w-lg mx-auto bg-slate-950 border border-emerald-500/30 rounded-2xl p-6 sm:p-8 text-center space-y-6 shadow-xl shadow-emerald-500/5">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-2xl font-bold text-white">Registration Confirmed!</h3>
                <p className="text-sm text-slate-400 mt-1">Your seat is successfully reserved for this session.</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-left space-y-2.5 text-sm">
                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">Student Name:</span>
                  <span className="font-semibold text-white">{successData.registration.student_name}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">Roll / College ID:</span>
                  <span className="font-mono font-semibold text-cyan-400">{successData.registration.college_id}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">Email (for Cert):</span>
                  <span className="font-medium text-slate-200">{successData.registration.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Department:</span>
                  <span className="text-slate-300">{successData.registration.department} ({successData.registration.year_of_study})</span>
                </div>
              </div>

              {/* Instructions on Attendance */}
              <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-800/40 text-left text-xs text-indigo-200 space-y-1.5">
                <p className="font-semibold text-indigo-300 flex items-center space-x-1">
                  <span>How to get your Certificate:</span>
                </p>
                <p>1. On the day of the event, attend the session in {event.venue}.</p>
                <p>2. Scan the dynamic rotating QR code projected on the hall screen using your smartphone.</p>
                <p>3. Once marked present, your verified certificate PDF will be generated and automatically delivered to <b>{successData.registration.email}</b>!</p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={onGoToCheckIn}
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-all shadow-md shadow-emerald-600/30"
                >
                  Test Student Check-In Demo
                </button>
                <button
                  onClick={onBack}
                  className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Student Registration Form */
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-800/50 text-rose-300 text-sm flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* 1. Student Full Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Full Name (as on Certificate) *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Aditi Sharma"
                      value={formData.student_name}
                      onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400">Please enter your name exactly as it should be printed.</span>
                </div>

                {/* 2. College / Roll ID */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    College Roll / Register ID *
                  </label>
                  <div className="relative">
                    <IdCard className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. 22CY045"
                      value={formData.college_id}
                      onChange={(e) => setFormData({ ...formData, college_id: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 uppercase focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400">Used to confirm attendance on event day.</span>
                </div>

                {/* 3. Email Address */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Email Address (Certificate Destination) *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                    <input
                      type="email"
                      required
                      placeholder="student@college.edu"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <span className="text-[11px] text-indigo-400 font-medium">Your verified certificate PDF will be emailed here!</span>
                </div>

                {/* 4. Phone Number */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Contact Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                    <input
                      type="tel"
                      required
                      placeholder="9876543210"
                      value={formData.phone_number}
                      onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400">10-digit mobile number for reminders.</span>
                </div>

                {/* 5. Department */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Department *
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500 pointer-events-none" />
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    >
                      {departments.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 6. Year of Study */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Year of Study *
                  </label>
                  <div className="relative">
                    <GraduationCap className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500 pointer-events-none" />
                    <select
                      value={formData.year_of_study}
                      onChange={(e) => setFormData({ ...formData, year_of_study: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    >
                      {years.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-4">
                <button
                  type="button"
                  onClick={onBack}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] disabled:opacity-50"
                >
                  {loading ? 'Processing Registration...' : 'Complete Registration'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
