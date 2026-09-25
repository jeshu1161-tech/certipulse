import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, MapPin, User, Users, CheckCircle, 
  ArrowRight, Plus, Sparkles, Shield, QrCode, FileText 
} from 'lucide-react';

export default function Home({ onSelectEvent, onLaunchProjector, onOpenAdmin }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    speaker_name: '',
    event_date: '',
    event_time: '10:00 AM - 01:00 PM',
    venue: '',
    department: 'Cybersecurity',
    max_capacity: 150
  });

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/events');
      const data = await res.json();
      setEvents(data);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent)
      });
      if (res.ok) {
        setShowCreateModal(false);
        setNewEvent({
          title: '',
          description: '',
          speaker_name: '',
          event_date: '',
          event_time: '10:00 AM - 01:00 PM',
          venue: '',
          department: 'Cybersecurity',
          max_capacity: 150
        });
        fetchEvents();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create event');
      }
    } catch (err) {
      alert('Error creating event: ' + err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-950 border border-indigo-900/40 p-8 sm:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Cybersecurity Department Academic Portal</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Events, Dynamic QR Attendance & <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400">Verifiable Certificates</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            Register for upcoming department workshops, scan real-time rotating QR codes on the hall projector to prevent proxy attendance, and receive automated verifiable digital credentials directly in your email.
          </p>

          <div className="pt-2 flex flex-wrap gap-4">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-lg shadow-indigo-600/30 hover:scale-[1.02] transition-all"
            >
              <Plus className="w-5 h-5" />
              <span>Host New Department Event</span>
            </button>
            <button
              onClick={() => onSelectEvent(events[0])}
              className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium transition-all"
            >
              <span>Quick Register Demo</span>
              <ArrowRight className="w-4 h-4 text-cyan-400" />
            </button>
          </div>
        </div>

        {/* Quick Department Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-8 border-t border-slate-800/80">
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-white">{events.length}</div>
            <div className="text-xs text-slate-400">Active Events</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-indigo-400">
              {events.reduce((sum, e) => sum + (e.total_registrations || 0), 0)}
            </div>
            <div className="text-xs text-slate-400">Total Registrations</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-emerald-400">
              {events.reduce((sum, e) => sum + (e.total_attended || 0), 0)}
            </div>
            <div className="text-xs text-slate-400">Verified Attendees</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-cyan-400">
              {events.reduce((sum, e) => sum + (e.total_certs_sent || 0), 0)}
            </div>
            <div className="text-xs text-slate-400">Certificates Dispatched</div>
          </div>
        </div>
      </div>

      {/* Events Listing */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Department Workshops & Seminars</h2>
            <p className="text-sm text-slate-400">Select an event to register, view attendance, or issue certificates</p>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            {events.length} Events Available
          </span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-400">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="py-20 text-center bg-slate-900/50 rounded-2xl border border-slate-800">
            <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No events found. Click "Host New Event" to create one!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((evt) => {
              const regCount = evt.total_registrations || 0;
              const attendedCount = evt.total_attended || 0;
              const certsSent = evt.total_certs_sent || 0;
              const capacityPct = Math.min(100, Math.round((regCount / (evt.max_capacity || 100)) * 100));

              return (
                <div
                  key={evt.id}
                  className="flex flex-col justify-between bg-slate-900/70 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-6 transition-all hover:shadow-xl hover:shadow-indigo-500/5 group"
                >
                  <div className="space-y-4">
                    {/* Top tags */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-950/80 text-indigo-300 border border-indigo-800/40">
                        {evt.department}
                      </span>
                      <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-800/40 flex items-center space-x-1">
                        <CheckCircle className="w-3 h-3" />
                        <span>Verifiable Cert</span>
                      </span>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-2">
                        {evt.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                        {evt.description || 'Hands-on practical session organized for students and faculty.'}
                      </p>
                    </div>

                    {/* Metadata details */}
                    <div className="space-y-2 text-xs text-slate-300 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span>{evt.event_date}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>{evt.event_time}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span className="truncate">{evt.venue}</span>
                      </div>
                      {evt.speaker_name && (
                        <div className="flex items-center space-x-2">
                          <User className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="truncate font-medium text-slate-200">{evt.speaker_name}</span>
                        </div>
                      )}
                    </div>

                    {/* Capacity bar */}
                    <div>
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>Registrations ({regCount}/{evt.max_capacity})</span>
                        <span>{capacityPct}%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${capacityPct}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-5 mt-4 border-t border-slate-800/80 space-y-2">
                    <button
                      onClick={() => onSelectEvent(evt)}
                      className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center space-x-2"
                    >
                      <User className="w-4 h-4" />
                      <span>Register for Event</span>
                    </button>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => onLaunchProjector(evt)}
                        title="Open dynamic rotating QR screen on projector"
                        className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700/60 flex items-center justify-center space-x-1.5 transition-colors"
                      >
                        <QrCode className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Projector QR</span>
                      </button>

                      <button
                        onClick={() => onOpenAdmin(evt)}
                        title="Manage registrations & send certificates"
                        className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700/60 flex items-center justify-center space-x-1.5 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Admin ({attendedCount})</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Create Event */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-xl font-bold text-white">Create New Department Event</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Reverse Engineering & Malware Analysis Workshop"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={newEvent.event_date}
                    onChange={(e) => setNewEvent({ ...newEvent, event_date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Time</label>
                  <input
                    type="text"
                    value={newEvent.event_time}
                    onChange={(e) => setNewEvent({ ...newEvent, event_time: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Venue / Lab *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cyber Lab 2, Academic Block"
                    value={newEvent.venue}
                    onChange={(e) => setNewEvent({ ...newEvent, venue: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Host Department</label>
                  <input
                    type="text"
                    value={newEvent.department}
                    onChange={(e) => setNewEvent({ ...newEvent, department: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Speaker / Resource Person</label>
                <input
                  type="text"
                  placeholder="e.g. Mr. John Doe (Threat Analyst at XYZ)"
                  value={newEvent.speaker_name}
                  onChange={(e) => setNewEvent({ ...newEvent, speaker_name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  rows="2"
                  placeholder="Provide an overview of the workshop objectives..."
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                ></textarea>
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium shadow-md shadow-indigo-600/30"
                >
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
