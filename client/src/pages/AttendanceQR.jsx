import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { 
  QrCode, RefreshCw, Users, ShieldAlert, 
  Maximize2, Minimize2, CheckCircle, ArrowLeft, 
  Clock, Sparkles, Volume2, VolumeX, ShieldCheck, Activity 
} from 'lucide-react';
import { soundFX } from '../utils/audio';

export default function AttendanceQR({ event, onBack, onTestCheckIn }) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [tokenInfo, setTokenInfo] = useState(null);
  const [secondsRemaining, setSecondsRemaining] = useState(10);
  const [stats, setStats] = useState({ total_registered: 0, total_attended: 0, turnout_percentage: 0, recent_attendees: [] });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const containerRef = useRef(null);

  // Clock ticker
  useEffect(() => {
    const clockTimer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(clockTimer);
  }, []);

  // 1. Fetch dynamic QR token
  const fetchQrToken = async () => {
    try {
      const res = await fetch(`/api/attendance/${event.id}/qr-token`);
      const data = await res.json();
      setTokenInfo(data);
      setSecondsRemaining(data.expires_in_seconds || 10);

      // Play subtle radar chirp if sound is enabled
      if (soundEnabled) {
        soundFX.playRadarPulse();
      }

      // Generate high-resolution visual QR image
      const url = await QRCode.toDataURL(data.check_in_url, {
        width: 420,
        margin: 1.5,
        color: {
          dark: '#090d16',
          light: '#ffffff'
        }
      });
      setQrDataUrl(url);
    } catch (err) {
      console.error('Failed to generate rotating token:', err);
    }
  };

  // 2. Fetch live turnout stats
  const fetchLiveTurnout = async () => {
    try {
      const res = await fetch(`/api/attendance/${event.id}/live-turnout`);
      const data = await res.json();
      
      // If turnout increased, play success sound
      if (soundEnabled && data.total_attended > stats.total_attended && stats.total_attended > 0) {
        soundFX.playSuccessChime();
      }
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch turnout stats:', err);
    }
  };

  // Rotation countdown
  useEffect(() => {
    fetchQrToken();
    fetchLiveTurnout();

    const statsInterval = setInterval(fetchLiveTurnout, 2500);

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          fetchQrToken();
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      clearInterval(statsInterval);
    };
  }, [event.id, soundEnabled]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => alert(err.message));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`min-h-screen bg-[#070b14] text-white flex flex-col justify-between p-6 sm:p-10 select-none cyber-grid relative ${
        isFullscreen ? 'fixed inset-0 z-50 p-8 sm:p-14' : 'max-w-7xl mx-auto'
      }`}
    >
      {/* Top HUD Display */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-6 relative z-10">
        <div className="flex items-center space-x-4">
          {!isFullscreen && (
            <button
              onClick={onBack}
              className="p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors shadow-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="text-xs px-3 py-1 rounded-lg bg-indigo-950/80 text-indigo-400 border border-indigo-800 font-bold tracking-wider uppercase flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Department Attendance Sentinel</span>
              </span>
              <span className="flex items-center space-x-1.5 text-xs text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-800/60 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Live Verification Active</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white mt-1.5 tracking-tight">
              {event.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-medium">
              {event.venue} • {event.event_date}
            </p>
          </div>
        </div>

        {/* Right HUD Controls: Clock & Sound & Fullscreen */}
        <div className="flex items-center space-x-3">
          <div className="hidden md:flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono text-cyan-300">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>{currentTime}</span>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Mute Audio Effects' : 'Enable Audio Feedback'}
            className={`p-3 rounded-2xl border transition-colors flex items-center space-x-2 text-xs font-semibold ${
              soundEnabled 
                ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300' 
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center space-x-2 text-xs"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Exit Fullscreen' : 'Auditorium Mode'}</span>
          </button>
        </div>
      </div>

      {/* Center: Dynamic QR code with Radar Halo */}
      <div className="my-auto py-6 flex flex-col items-center justify-center space-y-6 relative z-10">
        {/* Anti-Proxy Security Warning */}
        <div className="inline-flex items-center space-x-2.5 px-5 py-2 rounded-full bg-slate-900/90 border border-indigo-500/40 text-slate-200 text-xs sm:text-sm font-semibold shadow-2xl backdrop-blur-md">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
          <span>Anti-Proxy Protection: QR rotates every 10 seconds. Point your camera at the screen now!</span>
        </div>

        {/* QR Code Container with Radar Pulses */}
        <div className="relative">
          {/* Animated radar rings */}
          <div className="absolute -inset-8 rounded-full border-2 border-indigo-500/20 animate-radar pointer-events-none"></div>
          <div className="absolute -inset-16 rounded-full border border-cyan-500/10 animate-radar pointer-events-none delay-75"></div>

          <div className="relative bg-white p-6 sm:p-8 rounded-3xl shadow-[0_0_50px_-10px_rgba(99,102,241,0.3)] border-4 border-indigo-500/60 flex flex-col items-center">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Dynamic Attendance QR"
                className="w-64 h-64 sm:w-84 sm:h-84 object-contain rounded-xl"
              />
            ) : (
              <div className="w-64 h-64 sm:w-84 sm:h-84 flex items-center justify-center text-slate-400">
                Generating Token...
              </div>
            )}

            <div className="mt-3.5 text-center">
              <span className="text-xs font-extrabold tracking-wider uppercase text-slate-900">
                Scan With Phone Camera To Check-In
              </span>
            </div>
          </div>
        </div>

        {/* Token Countdown Circular / Linear Indicator */}
        <div className="w-full max-w-sm space-y-2">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-300">
            <span className="flex items-center space-x-2 text-slate-400">
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
              <span>Token Rotation Window</span>
            </span>
            <span className="font-mono text-cyan-400 text-sm font-bold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
              00:{secondsRemaining < 10 ? `0${secondsRemaining}` : secondsRemaining}
            </span>
          </div>

          <div className="w-full bg-slate-900 border border-slate-800 rounded-full h-2.5 overflow-hidden p-0.5">
            <div
              className="bg-gradient-to-r from-cyan-400 via-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-1000 ease-linear shadow-lg shadow-cyan-500/50"
              style={{ width: `${(secondsRemaining / 10) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Simulator Link for easy testing */}
        {tokenInfo && (
          <div>
            <button
              onClick={() => onTestCheckIn(tokenInfo.token)}
              className="text-xs text-indigo-400 hover:text-indigo-300 underline font-medium"
            >
              Test Check-In Screen with Current Live Token &rarr;
            </button>
          </div>
        )}
      </div>

      {/* Bottom Footer: Turnout Analytics & Live Ticker */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-800/80 items-center relative z-10">
        {/* Metric 1 */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-4 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wider font-bold">Physical Turnout</div>
            <div className="text-2xl font-black text-white mt-0.5">
              {stats.total_attended} <span className="text-slate-500 text-sm font-normal">/ {stats.total_registered} Registered</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Attendance rate bar */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-4">
          <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-bold">
            <span>Verified Attendance Rate</span>
            <span className="text-emerald-400 font-extrabold">{stats.turnout_percentage}%</span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-indigo-500 via-cyan-500 to-emerald-400 h-3 rounded-full transition-all duration-500"
              style={{ width: `${stats.turnout_percentage}%` }}
            ></div>
          </div>
        </div>

        {/* Metric 3: Live attendee stream ticker */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-4 overflow-hidden">
          <div className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-2 flex items-center space-x-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Real-Time Check-In Stream</span>
          </div>
          <div className="flex items-center space-x-2 overflow-x-auto text-xs py-0.5">
            {stats.recent_attendees && stats.recent_attendees.length > 0 ? (
              stats.recent_attendees.slice(0, 3).map((student, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 shrink-0 animate-fade-in shadow"
                >
                  <CheckCircle className="w-3 h-3 text-emerald-400" />
                  <span className="font-semibold text-white">{student.student_name}</span>
                  <span className="text-cyan-400 font-mono text-[10px]">({student.college_id})</span>
                </span>
              ))
            ) : (
              <span className="text-slate-500 italic">Waiting for first scan...</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
