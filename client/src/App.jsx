import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import EventRegister from './pages/EventRegister';
import AttendanceQR from './pages/AttendanceQR';
import CheckIn from './pages/CheckIn';
import AdminDashboard from './pages/AdminDashboard';
import TemplateEditor from './pages/TemplateEditor';
import VerifyCert from './pages/VerifyCert';

export default function App() {
  const [activePage, setActivePage] = useState('events');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [qrToken, setQrToken] = useState('');
  const [verifyCertId, setVerifyCertId] = useState('');

  // Handle URL parameters (e.g. from QR code scan or direct links)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pathname = window.location.pathname;

    if (pathname.includes('/verify/')) {
      const idFromPath = pathname.split('/verify/')[1];
      if (idFromPath) {
        setVerifyCertId(idFromPath);
        setActivePage('verify');
      }
    } else if (pathname.includes('/check-in') || params.has('token')) {
      const eventId = params.get('eventId');
      const token = params.get('token');
      if (token) setQrToken(token);
      if (eventId) {
        setSelectedEvent({ id: eventId });
      }
      setActivePage('checkin');
    }
  }, []);

  const handleSelectEventForRegistration = (event) => {
    setSelectedEvent(event);
    setActivePage('register');
  };

  const handleLaunchProjector = (event) => {
    setSelectedEvent(event);
    setActivePage('projector');
  };

  const handleOpenAdmin = (event) => {
    setSelectedEvent(event);
    setActivePage('admin');
  };

  const handleOpenTemplateEditor = (event) => {
    setSelectedEvent(event);
    setActivePage('template');
  };

  const handleTestCheckInFromProjector = (token) => {
    setQrToken(token);
    setActivePage('checkin');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans">
      {/* Hide navbar on projector view for immersive presentation */}
      {activePage !== 'projector' && (
        <Navbar activePage={activePage} setActivePage={setActivePage} />
      )}

      <main className="flex-1">
        {activePage === 'events' && (
          <Home
            onSelectEvent={handleSelectEventForRegistration}
            onLaunchProjector={handleLaunchProjector}
            onOpenAdmin={handleOpenAdmin}
          />
        )}

        {activePage === 'register' && selectedEvent && (
          <EventRegister
            event={selectedEvent}
            onBack={() => setActivePage('events')}
            onGoToCheckIn={() => setActivePage('checkin')}
          />
        )}

        {activePage === 'projector' && selectedEvent && (
          <AttendanceQR
            event={selectedEvent}
            onBack={() => setActivePage('events')}
            onTestCheckIn={handleTestCheckInFromProjector}
          />
        )}

        {activePage === 'checkin' && (
          <CheckIn
            eventId={selectedEvent?.id}
            token={qrToken}
            onNavigateHome={() => setActivePage('events')}
          />
        )}

        {activePage === 'admin' && (
          <AdminDashboard
            initialEventId={selectedEvent?.id}
            onOpenTemplateEditor={handleOpenTemplateEditor}
            onLaunchProjector={handleLaunchProjector}
          />
        )}

        {activePage === 'template' && selectedEvent && (
          <TemplateEditor
            event={selectedEvent}
            onBack={() => setActivePage('admin')}
          />
        )}

        {activePage === 'verify' && (
          <VerifyCert
            initialCertId={verifyCertId}
            onBack={() => setActivePage('events')}
          />
        )}
      </main>

      {/* Footer */}
      {activePage !== 'projector' && (
        <footer className="border-t border-slate-800/80 bg-slate-900/60 py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>
              <span className="font-semibold text-slate-400">CertiPulse Portal</span> • Department of Cybersecurity
            </div>
            <div>
              Built for Institutional Event Management & Anti-Proxy Dynamic Certification
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
