import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AdminAuthModal from './components/AdminAuthModal';
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
  
  // Admin Security Key State (persisted for the browser session)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return sessionStorage.getItem('certipulse_admin_auth') === 'true';
  });
  const [showAdminAuthModal, setShowAdminAuthModal] = useState(false);

  // Global Keyboard Pattern: Ctrl + Shift + Alt + A
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.altKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        setShowAdminAuthModal(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle URL parameters (QR code scan, deep links)
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
      if (eventId) setSelectedEvent({ id: eventId });
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
    if (!isAdminAuthenticated) {
      setShowAdminAuthModal(true);
    } else {
      setActivePage('admin');
    }
  };

  const handleAdminAuthSuccess = () => {
    setIsAdminAuthenticated(true);
    sessionStorage.setItem('certipulse_admin_auth', 'true');
    setActivePage('admin');
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    sessionStorage.removeItem('certipulse_admin_auth');
    setActivePage('events');
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
        <Navbar
          activePage={activePage}
          setActivePage={(page) => {
            if (page === 'admin' && !isAdminAuthenticated) {
              setShowAdminAuthModal(true);
            } else {
              setActivePage(page);
            }
          }}
          isAdminAuthenticated={isAdminAuthenticated}
          onAdminLogout={handleAdminLogout}
          onOpenAdminAuth={() => setShowAdminAuthModal(true)}
        />
      )}

      {/* Secret Security Key Gate Modal */}
      <AdminAuthModal
        isOpen={showAdminAuthModal}
        onClose={() => setShowAdminAuthModal(false)}
        onSuccess={handleAdminAuthSuccess}
      />

      <main className="flex-1">
        {activePage === 'events' && (
          <Home
            onSelectEvent={handleSelectEventForRegistration}
            onLaunchProjector={handleLaunchProjector}
            onOpenAdmin={handleOpenAdmin}
            isAdminAuthenticated={isAdminAuthenticated}
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
          isAdminAuthenticated ? (
            <AdminDashboard
              initialEventId={selectedEvent?.id}
              onOpenTemplateEditor={handleOpenTemplateEditor}
              onLaunchProjector={handleLaunchProjector}
            />
          ) : (
            <div className="py-24 text-center space-y-3">
              <p className="text-rose-400 font-bold">Access Restricted. Administrator credentials required.</p>
              <button
                onClick={() => setShowAdminAuthModal(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
              >
                Authenticate with Security Key
              </button>
            </div>
          )
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

      {/* Footer with subtle secret lock hint */}
      {activePage !== 'projector' && (
        <footer className="border-t border-slate-800/80 bg-slate-900/60 py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>
              <span className="font-semibold text-slate-400">CertiPulse Portal</span> • Department of Cybersecurity
            </div>
            <div className="flex items-center space-x-2">
              <span>Institutional Event Management & Dynamic Certification</span>
              <button
                onClick={() => setShowAdminAuthModal(true)}
                title="Coordinator Key Entry (Ctrl+Shift+Alt+A)"
                className="text-slate-600 hover:text-slate-400 text-[10px]"
              >
                🔒
              </button>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
