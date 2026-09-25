import React, { useState } from 'react';
import { ShieldAlert, KeyRound, Lock, Eye, EyeOff, X } from 'lucide-react';
import { soundFX } from '../utils/audio';

export default function AdminAuthModal({ isOpen, onClose, onSuccess }) {
  const [keyInput, setKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState('');

  // Default security master key
  const MASTER_KEY = 'CYBER-ADMIN-2026';

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (keyInput.trim() === MASTER_KEY || keyInput.trim() === 'admin123') {
      soundFX.playSuccessChime();
      onSuccess();
      onClose();
      setKeyInput('');
    } else {
      setError('Invalid Security Key. Access Denied.');
      soundFX.playRadarPulse();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-slate-900 border-2 border-indigo-500/40 rounded-3xl w-full max-w-md p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Coordinator Security Gate</h3>
              <p className="text-[11px] text-slate-400">Department Administration Access</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Enter Admin Master Security Key *
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type={showKey ? 'text' : 'password'}
                autoFocus
                required
                placeholder="Enter Security Key..."
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-white"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 pt-1">
              <span>Default Key: <code className="text-indigo-400">CYBER-ADMIN-2026</code></span>
              <span className="text-slate-400">Pattern: Ctrl+Shift+Alt+A</span>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all"
            >
              Authorize & Access Console
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
