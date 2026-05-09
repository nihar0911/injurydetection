import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Activity, Home, User, LogOut, ShieldAlert } from 'lucide-react';
import { auth } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <ShieldAlert className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-slate-100">Athlete.AI <span className="text-slate-500 font-normal">/ Active</span></h1>
              {profile && (
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Pro Athlete: {profile.displayName}</p>
              )}
            </div>
          </div>
          
          {user && (
            <div className="flex items-center gap-6">
              <button 
                onClick={handleLogout}
                className="text-slate-500 hover:text-red-400 transition-colors bg-slate-900 border border-slate-800 p-2 rounded-lg"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
              {profile && (
                <div className="w-10 h-10 rounded-full bg-slate-800 p-0.5 border border-indigo-500/30 overflow-hidden">
                  <img 
                    src={user.photoURL || `https://ui-avatars.com/api/?name=${profile.displayName}&background=4f46e5&color=fff`} 
                    alt="avatar" 
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8 pb-32">
        {children}
      </main>

      {/* Bottom Nav / Mobile Status Bar (Simulated Footer from Design) */}
      {user && (
        <nav className="fixed bottom-0 left-0 right-0 bg-slate-950 border-t border-slate-800 h-16 px-6 z-50 flex flex-col justify-center">
          <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <span className="mono-label">BP:</span>
                <span className="text-xs text-slate-300">118/76</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="mono-label">O2:</span>
                <span className="text-xs text-slate-300">98%</span>
              </div>
              <div className="hidden sm:flex items-center gap-2 border-l border-slate-800 pl-6">
                <span className="mono-label">SYSTEM:</span>
                <span className="text-xs text-emerald-400">AI READY</span>
              </div>
            </div>
            
            <div className="flex gap-8">
              <button className="flex items-center gap-2 text-indigo-400">
                <Home className="w-5 h-5" />
                <span className="text-[10px] uppercase font-bold tracking-widest hidden sm:inline">Home</span>
              </button>
              <button className="flex items-center gap-2 text-slate-500 hover:text-slate-300 transition-colors">
                <Activity className="w-5 h-5" />
                <span className="text-[10px] uppercase font-bold tracking-widest hidden sm:inline">Triage</span>
              </button>
            </div>
          </div>
        </nav>
      )}
    </div>
  );
};

export default Layout;
