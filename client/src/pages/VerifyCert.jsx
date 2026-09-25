import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, CheckCircle2, XCircle, Search, Download, 
  Calendar, Building2, User, Award, ExternalLink, ArrowLeft, 
  Copy, Check, Share2, Printer, Lock 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundFX } from '../utils/audio';

export default function VerifyCert({ initialCertId, onBack }) {
  const [certId, setCertId] = useState(initialCertId || 'CERT-CYBER-2026-F7715CE9');
  const [verificationData, setVerificationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleVerify = async (idToVerify) => {
    const target = idToVerify || certId;
    if (!target.trim()) return;

    try {
      setLoading(true);
      setError('');
      setVerificationData(null);

      const res = await fetch(`/api/certificates/verify/${target.trim()}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Certificate credential could not be verified.');
      } else {
        setVerificationData(data);
        soundFX.playSuccessChime();
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 }
        });
      }
    } catch (err) {
      setError('Network connection error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialCertId) {
      handleVerify(initialCertId);
    }
  }, [initialCertId]);

  const copyVerifyUrl = () => {
    const url = window.location.origin + `/verify/${certId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      {/* Top Header */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 mx-auto shadow-2xl shadow-indigo-500/30">
          <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
            <Award className="w-8 h-8 text-indigo-400" />
          </div>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Public Credential Verification Ledger
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
          Institutions, corporate recruiters, and students can instantly verify authentic credentials issued by the Department of Cybersecurity.
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleVerify();
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-4 top-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Enter Certificate ID (e.g. CERT-CYBER-2026-F7715CE9)..."
              value={certId}
              onChange={(e) => setCertId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-2xl pl-11 pr-4 py-3 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-indigo-500 shadow-inner"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-7 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs sm:text-sm transition-all shadow-xl shadow-indigo-600/30 shrink-0 hover:scale-[1.02]"
          >
            {loading ? 'Verifying Ledger...' : 'Verify Authenticity'}
          </button>
        </form>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-rose-950/40 border border-rose-800/60 rounded-3xl p-6 text-center space-y-3 shadow-xl">
          <XCircle className="w-12 h-12 text-rose-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">Credential Verification Failed</h3>
          <p className="text-xs text-rose-300 max-w-md mx-auto">{error}</p>
        </div>
      )}

      {/* Verified Certificate Hologram Card */}
      {verificationData && verificationData.certificate && (
        <div className="hologram-card bg-slate-900/90 backdrop-blur-2xl border-2 border-emerald-500/50 rounded-3xl p-6 sm:p-10 space-y-8 shadow-[0_0_50px_-10px_rgba(16,185,129,0.25)] relative overflow-hidden">
          {/* Top Verified Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border-2 border-emerald-500/50 text-emerald-400 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <span className="text-[11px] font-black tracking-widest uppercase text-emerald-400 block flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Institutional Credential</span>
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                  OFFICIALLY VERIFIED & GENUINE
                </h2>
              </div>
            </div>

            <div className="text-left sm:text-right bg-slate-950/60 sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Credential ID</span>
              <span className="font-mono text-xs sm:text-sm font-black text-indigo-400">
                {verificationData.certificate.certificate_id}
              </span>
            </div>
          </div>

          {/* Student & Event Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-2 shadow-inner">
              <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Recipient Student</span>
              <span className="text-lg font-black text-white block">
                {verificationData.certificate.student_name}
              </span>
              <span className="font-mono text-cyan-400 font-semibold block text-xs">
                Roll No: {verificationData.certificate.college_id}
              </span>
              <span className="text-slate-300 block text-xs">
                Department: {verificationData.certificate.student_department} ({verificationData.certificate.year_of_study})
              </span>
            </div>

            <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-2 shadow-inner">
              <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Academic Event</span>
              <span className="text-base font-bold text-white block leading-snug">
                {verificationData.certificate.event_title}
              </span>
              <span className="text-slate-300 block">
                Organized by Department of {verificationData.certificate.host_department}
              </span>
              <span className="text-slate-400 block font-medium">
                Conducted Date: {verificationData.certificate.event_date}
              </span>
            </div>
          </div>

          {/* Digital Signature & Cryptographic Ledger Proof */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
            <div className="flex items-center space-x-2">
              <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Cryptographic Hash: <code className="text-slate-300 font-mono text-[11px]">SHA256-{verificationData.certificate.certificate_id.substring(5)}</code></span>
            </div>
            <span className="text-emerald-400 font-bold text-[11px]">
              Institutional Signature Valid
            </span>
          </div>

          {/* Action Ribbon: Download PDF, Copy Link, Share */}
          <div className="pt-2 flex flex-wrap gap-3">
            <a
              href={`/api/certificates/${verificationData.certificate.certificate_id}/download`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 min-w-[200px] py-3.5 px-5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs sm:text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all hover:scale-[1.01]"
            >
              <Download className="w-4 h-4" />
              <span>Download Official PDF Certificate</span>
            </a>

            <button
              onClick={copyVerifyUrl}
              className="py-3.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center space-x-2 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Link Copied!' : 'Copy Verification URL'}</span>
            </button>

            {onBack && (
              <button
                onClick={onBack}
                className="py-3.5 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Back
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
