import React from 'react';
import { ShieldCheck, Calendar, QrCode, UserCheck, Award, Lock, LogOut } from 'lucide-react';

export default function Navbar({ activePage, setActivePage, isAdminAuthenticated, onAdminLogout, onOpenAdminAuth }) {
  // Public navigation items visible to all students
  const navItems = [
    { id: 'events', label: 'Events & Workshops', icon: Calendar },
    { id: 'projector', label: 'Projector QR', icon: QrCode },
    { id: 'checkin', label: 'Student Check-In', icon: UserCheck },
    { id: 'verify', label: 'Verify Certificate', icon: Award },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Department Branding */}
          <div 
            onClick={() => setActivePage('events')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-white via-indigo-200 to-cyan-300 bg-clip-text text-transparent">
                CertiPulse
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-800/50">
                Cybersecurity Dept
              </span>
            </div>
          </div>

          {/* Navigation Links (Public - Admin is hidden) */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* If Admin is Authenticated, show Admin Portal access */}
            {isAdminAuthenticated && (
              <div className="flex items-center pl-2 space-x-1 border-l border-slate-800">
                <button
                  onClick={() => setActivePage('admin')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activePage === 'admin'
                      ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                      : 'bg-amber-950/60 text-amber-300 border border-amber-800/60 hover:bg-amber-900/60'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Admin Console</span>
                </button>

                <button
                  onClick={onAdminLogout}
                  title="Lock Admin Session"
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Secret Discrete Trigger for Mobile / Touch screens (Hidden in plain sight) */}
          <div className="flex items-center space-x-2">
            {!isAdminAuthenticated && (
              <button
                onClick={onOpenAdminAuth}
                title="Department Coordinator Access"
                className="opacity-20 hover:opacity-100 p-2 text-slate-500 hover:text-indigo-400 transition-opacity"
              >
                <Lock className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Mobile Selector */}
            <div className="flex md:hidden items-center space-x-1">
              <select
                value={activePage}
                onChange={(e) => setActivePage(e.target.value)}
                className="bg-slate-800 text-slate-200 border border-slate-700 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {navItems.map(item => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
                {isAdminAuthenticated && <option value="admin">Admin Console</option>}
              </select>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
