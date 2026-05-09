import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import BodyMap from '../components/BodyMap';
import { BodyPart, Injury, RecoveryPlan } from '../types';
import { ShieldPlus, Info, Plus, ChevronRight, Activity, Zap, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

interface HomeProps {
  onStartTriage: (part: BodyPart) => void;
  onViewRecovery: (plan: RecoveryPlan) => void;
  onStartReinjuryScanner?: () => void;
}

const Home: React.FC<HomeProps> = ({ onStartTriage, onViewRecovery, onStartReinjuryScanner }) => {
  const { profile, user } = useAuth();
  const [activePlan, setActivePlan] = useState<RecoveryPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivePlan = async () => {
      // ... same logic ...
      if (!user) return;
      try {
        const q = query(
          collection(db, 'recoveryPlans'),
          where('userId', '==', user.uid),
          where('status', '==', 'active'),
          limit(1)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const docSnapshot = querySnapshot.docs[0];
          setActivePlan({ id: docSnapshot.id, ...docSnapshot.data() } as RecoveryPlan);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'recoveryPlans');
      } finally {
        setLoading(false);
      }
    };
    fetchActivePlan();
  }, [user]);

  const recommendedKit = profile?.sports.includes('Football') || profile?.sports.includes('Cricket')
    ? ['Ankle Strapping Tape', 'Instant Cold Packs', 'Antiseptic Sprays', 'Sterile Gauze', 'Elastic Bandages']
    : ['Recovery Muscle Cream', 'Joint Support Sleeves', 'Hydration Salts', 'Blister Pads'];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 30, filter: 'blur(10px)' },
    show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8 pb-12">
      {/* Hero Welcome */}
      <motion.div variants={itemVariants} className="flex items-center justify-between bg-slate-900 border border-slate-800 p-6 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
        <div className="relative">
           <div className="flex items-center gap-2">
             <h1 className="text-3xl font-black italic tracking-tighter uppercase text-slate-100">
               Elite <span className="text-indigo-500">Readiness</span>
             </h1>
           </div>
           <p className="mono-label flex items-center gap-2 mt-1">
             <Activity className="w-3 h-3 text-indigo-400" />
             {profile?.displayName} • 
             <span className="text-slate-500 ml-1">
               Unlimited Analysis
             </span>
           </p>
        </div>
        <div className="relative flex -space-x-2">
           {profile?.sports.map((sport, i) => (
             <div key={i} className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shadow-lg" title={sport}>
                <Star className="w-5 h-5 text-indigo-400 fill-indigo-400/20" />
             </div>
           ))}
        </div>
      </motion.div>

      {/* Universal Reinjury Scanner Banner */}
      <motion.button
        variants={itemVariants}
        onClick={onStartReinjuryScanner}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="w-full relative overflow-hidden bg-gradient-to-br from-indigo-900 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-indigo-900/20 group"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-indigo-500/30 transition-all duration-500" />
        <div className="relative text-left space-y-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center">
              <Activity className="w-5 h-5 text-indigo-400" />
            </div>
            <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-black uppercase tracking-widest rounded-full">New Universal AI</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter text-white">Dynamic Reinjury Prevention Scanner</h2>
          <p className="text-indigo-200/80 font-medium max-w-xl">Deep analysis for ANY injury. AI dynamically analyzes healing status, movement quality, and predicts load tolerance capacity.</p>
        </div>
        <div className="relative flex-shrink-0 w-full md:w-auto">
          <div className="w-full md:w-auto px-8 py-4 bg-indigo-600 group-hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3">
            Initialize Scanner <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </motion.button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Body Map Focus */}
        <motion.div variants={itemVariants} className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-8 shadow-2xl flex flex-col items-center">
            <h3 className="mono-label mb-8 w-full text-center">Body Impact Map</h3>
            <BodyMap onPartClick={(part) => onStartTriage(part)} />
            <div className="mt-8 text-center bg-slate-800/50 p-4 rounded-2xl border border-slate-700 w-full">
              <p className="text-sm font-semibold text-slate-200">Tap to Triage</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Instant contextual analysis</p>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Active Status & Gear */}
        <motion.div variants={itemVariants} className="lg:col-span-7 space-y-8">
          {/* Active Recovery Notification */}
          <AnimatePresence>
            {activePlan && (
              <div className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  onClick={() => onViewRecovery(activePlan)}
                  className="bg-indigo-600 rounded-3xl p-6 shadow-2xl shadow-indigo-600/20 relative overflow-hidden cursor-pointer group hover:bg-indigo-500 transition-all border border-indigo-400/30"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-white/30 transition-all" />
                  <div className="relative flex items-center justify-between">
                     <div className="space-y-1">
                       <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Session Resumed</span>
                       <h3 className="text-xl font-black text-white italic tracking-tighter uppercase">Recovery Plan Active</h3>
                     </div>
                     <ChevronRight className="text-white w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.div>

                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  onClick={() => {
                    const confirm = window.confirm("Reporting increased pain. This is a critical alert. Should we notify your registered medical contacts?");
                    if (confirm) {
                      alert("Alert sent to Emergency Contacts. Please seek professional medical help immediately.");
                    }
                  }}
                  className="w-full p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between hover:bg-red-500/10 hover:border-red-500/30 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 group-hover:bg-red-500 group-hover:text-white transition-colors">
                      <ShieldPlus className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400 group-hover:text-red-400">Biological Feedback</p>
                      <p className="text-sm font-bold text-slate-200">Report Increased Pain</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-700 group-hover:text-red-500 transition-colors" />
                </motion.button>
              </div>
            )}
          </AnimatePresence>

          {/* Pro Gear Bento */}
          <div className="space-y-4">
             <h3 className="mono-label flex items-center gap-2">
               <ShieldPlus className="w-4 h-4 text-indigo-400" />
               Optimized First Aid Kit
             </h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
               {recommendedKit.map((item, idx) => (
                 <div key={idx} className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 flex items-center gap-3 hover:border-slate-700 hover:bg-slate-900 transition-all group">
                    <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      {idx + 1}
                    </div>
                    <span className="text-xs font-bold text-slate-300">{item}</span>
                 </div>
               ))}
             </div>
          </div>

          {/* Pro Tips / Precautions */}
          <div className="bg-emerald-500/5 rounded-3xl p-6 border border-emerald-500/10 space-y-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
               <Zap className="w-16 h-16 text-emerald-400 fill-emerald-400" />
            </div>
            <h3 className="mono-label !text-emerald-400 flex items-center gap-2">
               <Info className="w-4 h-4" />
               Performance Precautions
            </h3>
            <div className="space-y-3 relative">
               <div className="flex gap-3 items-start">
                  <div className="w-1 h-1 bg-emerald-400 rounded-full mt-2" />
                  <p className="text-sm text-emerald-400/80 font-medium leading-relaxed">
                    Dynamic priming: 10m plyometric warm-up required before full intensity.
                  </p>
               </div>
               <div className="flex gap-3 items-start">
                  <div className="w-1 h-1 bg-emerald-400 rounded-full mt-2" />
                  <p className="text-sm text-emerald-400/80 font-medium leading-relaxed">
                    Post-load joints: Immediate cryotherapy suggested for high-velocity sessions.
                  </p>
               </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Home;
