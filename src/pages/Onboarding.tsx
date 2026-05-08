import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Trophy, Activity, MessageSquare, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

const SPORTS = ['Football', 'Cricket', 'Basketball', 'Tennis', 'Running', 'Swimming', 'Combat Sports'];

const Onboarding = () => {
  const { user, refreshProfile } = useAuth();
  const [sports, setSports] = useState<string[]>([]);
  const [pastInjuries, setPastInjuries] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toggleSport = (sport: string) => {
    setSports(prev => prev.includes(sport) ? prev.filter(s => s !== sport) : [...prev, sport]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || sports.length === 0) return;
    setSubmitting(true);
    try {
      await setDoc(doc(db, 'profiles', user.uid), {
        userId: user.uid,
        displayName: user.displayName || 'Athlete',
        sports,
        pastInjuries,
        tier: 'free',
        scansCount: 0,
        createdAt: serverTimestamp(),
      });
      await refreshProfile();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `profiles/${user.uid}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4 space-y-12">
      <div className="space-y-4">
        <div className="w-16 h-1 bg-indigo-500 rounded-full" />
        <h1 className="text-4xl font-black italic tracking-tighter uppercase text-slate-100">
          Athlete <br /><span className="text-indigo-500">Configuration</span>
        </h1>
        <p className="text-slate-400 font-medium leading-relaxed">
          Calibrate our AI logic to your specific athletic biomechanics and history.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        {/* Sports Selection */}
        <div className="space-y-4">
          <label className="mono-label flex items-center gap-2">
            <Trophy className="w-3 h-3 text-indigo-400" />
            Specialized Disciplines
          </label>
          <div className="flex flex-wrap gap-3">
            {SPORTS.map(sport => (
              <button
                key={sport}
                type="button"
                onClick={() => toggleSport(sport)}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                  sports.includes(sport)
                    ? 'bg-indigo-600 border-indigo-400 text-white shadow-xl shadow-indigo-600/20 scale-105'
                    : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
                }`}
              >
                {sport}
              </button>
            ))}
          </div>
        </div>

        {/* Past Injuries */}
        <div className="space-y-4">
          <label className="mono-label flex items-center gap-2">
            <Activity className="w-3 h-3 text-indigo-400" />
            Trauma History
          </label>
          <div className="relative group">
            <textarea
              value={pastInjuries}
              onChange={(e) => setPastInjuries(e.target.value)}
              placeholder="e.g. 2022 ACL Reconstruction, Chronic ligament laxity..."
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 text-sm font-medium focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none min-h-[140px] text-slate-100 placeholder:text-slate-700"
            />
            <MessageSquare className="absolute bottom-5 right-5 text-slate-700 group-focus-within:text-indigo-500 transition-colors w-5 h-5 pointer-events-none" />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting || sports.length === 0}
          className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black italic tracking-tighter uppercase text-xl shadow-2xl shadow-indigo-600/30 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:shadow-none hover:translate-y-[-2px] active:translate-y-0 transition-all flex items-center justify-center gap-3 group"
        >
          {submitting ? 'Initializing Systems...' : 'Access AI Core'}
          <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
        </button>
      </form>
    </div>
  );
};

export default Onboarding;
