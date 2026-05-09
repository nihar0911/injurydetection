import React, { useState } from 'react';
import { ShieldAlert, Zap, AlertTriangle, ArrowRight, Mail, Lock, UserPlus, LogIn } from 'lucide-react';
import { signUpWithEmail, signInWithEmail } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { enableDemoMode } = useAuth();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    try {
      setError(null);
      setIsLoading(true);
      
      if (isSignUp) {
        await signUpWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: any) {
      console.warn("Firebase Auth Error:", err);
      setError(err.message || "Failed to authenticate with database.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-950">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8 text-center"
      >
        <div className="inline-flex items-center gap-3 p-2 px-4 bg-slate-900 rounded-full border border-slate-800 shadow-xl shadow-indigo-500/5">
           <Zap className="w-4 h-4 text-indigo-400 fill-indigo-400" />
           <span className="mono-label !text-slate-400">The Ultimate Athlete's Shield</span>
        </div>

        <div className="space-y-4">
          <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl relative group overflow-hidden shadow-indigo-500/20">
            <ShieldAlert className="text-white w-10 h-10 relative z-10" />
            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
          </div>
          <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none text-slate-100">
            Athlete.<span className="text-indigo-500">AI</span>
          </h1>
          <p className="text-slate-400 text-sm font-medium max-w-[280px] mx-auto leading-relaxed">
            Instant AI triage and visual analysis.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-400 text-sm font-bold flex flex-col gap-2 text-left shadow-lg">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button 
              type="button" 
              onClick={enableDemoMode} 
              className="mt-2 text-xs font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 self-start px-2 py-1 bg-indigo-500/10 rounded-md transition-colors"
            >
              Enter Demo Mode Instantly
            </button>
          </div>
        )}

        <form onSubmit={handleAuth} className="bg-slate-900/80 backdrop-blur-xl p-8 rounded-3xl border border-slate-800 space-y-6 shadow-2xl">
          <div className="space-y-4">
            <div className="space-y-1.5 text-left">
              <label className="mono-label text-slate-400 ml-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="athlete@team.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-slate-200 outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-700"
                />
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="mono-label text-slate-400 ml-2">Secure Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-slate-200 outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-700"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold italic tracking-tighter uppercase text-lg shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:hover:scale-100 mt-4"
          >
            {isSignUp ? <><UserPlus className="w-5 h-5" /> Create Account</> : <><LogIn className="w-5 h-5" /> Access Portal</>}
          </button>

          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-slate-400 text-sm font-medium hover:text-indigo-400 transition-colors mt-4 inline-flex items-center gap-2"
          >
            {isSignUp ? "Already have an account? Sign in." : "Need an account? Sign up."} <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;
