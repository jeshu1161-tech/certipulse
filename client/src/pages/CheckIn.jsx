import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, AlertCircle, CheckCircle2, User, 
  Camera, Keyboard, ArrowRight, Clock, MapPin, 
  Sparkles, RefreshCw, Volume2, VolumeX 
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import confetti from 'canvas-confetti';
import { soundFX } from '../utils/audio';

export default function CheckIn({ eventId, token, onNavigateHome }) {
  const [selectedEventId, setSelectedEventId] = useState(eventId || '');
  const [currentToken, setCurrentToken] = useState(token || '');
  const [identifier, setIdentifier] = useState('');
  const [events, setEvents] = useState([]);
  const [eventDetails, setEventDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusResult, setStatusResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Scanner state
  const [scannerActive, setScannerActive] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  // Fetch events
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

  // Fetch details of selected event
  useEffect(() => {
    if (selectedEventId) {
      fetch(`/api/events/${selectedEventId}`)
        .then(res => res.json())
        .then(data => setEventDetails(data))
        .catch(console.error);
    }
  }, [selectedEventId]);

  // Clean up camera scanner on unmount
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  // Toggle Live Camera Scanner
  const startCameraScanner = async () => {
    setScannerError('');
    setScannerActive(true);

    try {
      // Small timeout to allow DOM container to render
      setTimeout(async () => {
        const qrCodeScanner = new Html5Qrcode('qr-reader-container');
        html5QrCodeRef.current = qrCodeScanner;

        await qrCodeScanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            // Success callback: QR code captured!
            handleScannedUrl(decodedText);
          },
          (err) => {
            // Frame scan failure (ignore standard non-detections)
          }
        );
      }, 200);
    } catch (err) {
      setScannerError('Could not access camera: ' + err.message + '. Please ensure camera permissions are allowed, or use manual entry below.');
      setScannerActive(false);
    }
  };

  const stopCameraScanner = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      await html5QrCodeRef.current.stop();
    }
    setScannerActive(false);
  };

  // Parse scanned URL from projector
  const handleScannedUrl = (scannedString) => {
    try {
      let urlObj;
      if (scannedString.startsWith('http://') || scannedString.startsWith('https://')) {
        urlObj = new URL(scannedString);
      } else {
        urlObj = new URL(`http://localhost${scannedString.startsWith('/') ? '' : '/'}${scannedString}`);
      }

      const parsedEventId = urlObj.searchParams.get('eventId');
      const parsedToken = urlObj.searchParams.get('token');

      if (parsedToken) {
        setCurrentToken(parsedToken);
        if (parsedEventId) setSelectedEventId(parsedEventId);
        soundFX.playRadarPulse();
        stopCameraScanner();
      }
    } catch (e) {
      // If raw token string was scanned directly
      setCurrentToken(scannedString.trim());
      soundFX.playRadarPulse();
      stopCameraScanner();
    }
  };

  // Submit attendance confirmation
  const handleCheckIn = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setStatusResult(null);

    if (!identifier.trim()) {
      setErrorMessage('Please enter your College Roll No or Registered Email.');
      return;
    }

    try {
      setLoading(true);

      // If token is missing, fetch fresh live token for seamless demo
      let activeToken = currentToken;
      if (!activeToken) {
        const tokenRes = await fetch(`/api/attendance/${selectedEventId}/qr-token`);
        const tokenData = await tokenRes.json();
        activeToken = tokenData.token;
        setCurrentToken(activeToken);
      }

      const res = await fetch(`/api/attendance/${selectedEventId}/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: activeToken,
          identifier: identifier.trim()
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to verify attendance.');
        return;
      }

      setStatusResult(data);
      soundFX.playSuccessChime();

      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (err) {
      setErrorMessage('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
      {/* Top Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 mx-auto shadow-xl shadow-indigo-500/20">
          <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-indigo-400" />
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          Event Attendance Verification
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
          Scan the projector's live dynamic QR code with your camera or enter your credentials to record presence.
        </p>
      </div>

      {/* Main Glass Card */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Event context preview */}
        {eventDetails && (
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-indigo-400 font-bold uppercase tracking-wider">
                {eventDetails.department}
              </span>
              <span className="text-slate-400 flex items-center space-x-1">
                <Clock className="w-3 h-3 text-cyan-400" />
                <span>{eventDetails.event_date}</span>
              </span>
            </div>
            <h2 className="text-base font-bold text-white leading-snug">
              {eventDetails.title}
            </h2>
            <div className="flex items-center space-x-2 text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span className="truncate">{eventDetails.venue}</span>
            </div>
          </div>
        )}

        {/* Live Camera Scanner vs Manual Mode Switcher */}
        <div className="flex items-center justify-center gap-2 p-1.5 rounded-2xl bg-slate-950 border border-slate-800">
          <button
            type="button"
            onClick={scannerActive ? stopCameraScanner : startCameraScanner}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
              scannerActive 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Camera className="w-4 h-4 text-cyan-400" />
            <span>{scannerActive ? 'Stop Camera' : 'Live Camera Scanner'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (scannerActive) stopCameraScanner();
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
              !scannerActive 
                ? 'bg-slate-800 text-white' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Keyboard className="w-4 h-4 text-emerald-400" />
            <span>Manual Check-In</span>
          </button>
        </div>

        {/* Camera Viewfinder Box */}
        {scannerActive && (
          <div className="space-y-3">
            <div className="relative rounded-2xl overflow-hidden bg-black border-2 border-indigo-500/50 shadow-inner aspect-square max-w-xs mx-auto">
              {/* Laser scan line overlay */}
              <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#38bdf8] animate-laser z-20 pointer-events-none"></div>

              {/* Viewfinder corner brackets */}
              <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-indigo-400 z-10 pointer-events-none"></div>
              <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-indigo-400 z-10 pointer-events-none"></div>
              <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-indigo-400 z-10 pointer-events-none"></div>
              <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-indigo-400 z-10 pointer-events-none"></div>

              {/* The HTML5 QR element */}
              <div id="qr-reader-container" className="w-full h-full"></div>
            </div>
            <p className="text-[11px] text-center text-slate-400">
              Align the projector screen's QR code within the frame to scan automatically.
            </p>
          </div>
        )}

        {scannerError && (
          <p className="text-xs text-amber-400 bg-amber-950/40 p-3 rounded-xl border border-amber-800/40 text-center">
            {scannerError}
          </p>
        )}

        {/* Security Token Status Pill */}
        <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
          <span className="text-slate-400">Dynamic Security Token:</span>
          {currentToken ? (
            <span className="font-mono text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded border border-emerald-800/60 font-semibold flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{currentToken.substring(0, 10)}... (Valid)</span>
            </span>
          ) : (
            <span className="text-indigo-400 font-medium">Ready (Auto-synced)</span>
          )}
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <div>
              <p className="font-semibold">Verification Alert</p>
              <p className="mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Success Card Result */}
        {statusResult ? (
          <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-white">Attendance Verified!</h3>
              <p className="text-xs text-slate-300 mt-1">{statusResult.message}</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs text-left space-y-2">
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">Student Name:</span>
                <span className="font-bold text-white">{statusResult.student.name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">Roll / College ID:</span>
                <span className="font-mono text-cyan-400 font-semibold">{statusResult.student.college_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Verified Timestamp:</span>
                <span className="text-slate-300">{statusResult.student.attended_at}</span>
              </div>
            </div>

            <div className="p-3 bg-indigo-950/40 border border-indigo-800/40 rounded-xl text-left text-[11px] text-indigo-300 space-y-1">
              <p className="font-semibold">Next Step:</p>
              <p>Your official verifiable certificate will be automatically compiled and dispatched to your email inbox once the session ends!</p>
            </div>

            <button
              onClick={onNavigateHome}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
            >
              Back to Events
            </button>
          </div>
        ) : (
          /* Check-In Input Form */
          <form onSubmit={handleCheckIn} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Enter Your College Roll No or Registered Email *
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="e.g. 21CY015 or student@college.edu"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Must match the information submitted during event registration.
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all hover:scale-[1.01] disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{loading ? 'Validating Token & Credentials...' : 'Confirm Verified Attendance'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
