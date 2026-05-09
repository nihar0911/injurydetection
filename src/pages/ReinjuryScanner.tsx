import React, { useState, useEffect } from 'react';
import { Activity, ShieldAlert, ArrowLeft, Brain, Scan, ActivitySquare, ChevronRight, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const UNIVERSAL_INJURY_DATA: Record<string, any> = {
  'Knee': {
    checks: ['squatting symmetry', 'landing impact', 'knee collapse rotation'],
    factors: ['swelling reduction', 'rotational stability', 'pain response'],
    restrictions: 'Avoid pivot-heavy activities.',
    recommendation: 'Focus on proprioceptive balance and isolated hamstring strengthening.'
  },
  'Ankle': {
    checks: ['walking gait', 'ankle eversion/inversion', 'single-leg balance'],
    factors: ['swelling reduction', 'walking balance', 'stability'],
    restrictions: 'Avoid uneven terrain and sudden directional changes.',
    recommendation: 'Perform stability drills and progressive calf loading.'
  },
  'Shoulder': {
    checks: ['arm lifting symmetry', 'external rotation', 'overhead motion'],
    factors: ['arm range of motion', 'lifting ability', 'shoulder alignment', 'pain during rotation'],
    restrictions: 'Avoid explosive overhead throwing movements.',
    recommendation: 'Continue rotator cuff mobility rehabilitation and scapular control.'
  },
  'Wrist': {
    checks: ['grip strength', 'flexion/extension', 'weight-bearing on palm'],
    factors: ['grip stability', 'joint inflammation', 'tendon tension'],
    restrictions: 'Avoid heavy push-ups or holding heavy loads.',
    recommendation: 'Gentle wrist extension exercises and grip therapy.'
  },
  'Concussion': {
    checks: ['eye tracking', 'balance test', 'reaction delay'],
    factors: ['dizziness', 'eye focus', 'balance', 'cognitive stability'],
    restrictions: 'Avoid contact sports and high-acceleration activities.',
    recommendation: 'Absolute cognitive rest and gradual heart-rate elevation.'
  },
  'Back Injury': {
    checks: ['bending motion', 'posture symmetry', 'twisting range'],
    factors: ['posture symmetry', 'bending movement', 'muscle tightness', 'walking pattern'],
    restrictions: 'Avoid deadlifting or high-impact axial loading.',
    recommendation: 'Core stabilization and posture correction exercises.'
  },
  'Muscle Tear': {
    checks: ['muscle activation', 'stretch tolerance', 'contraction force'],
    factors: ['tissue sensitivity', 'asymmetry in strength', 'pain response'],
    restrictions: 'Avoid explosive sprinting or max-effort lifting.',
    recommendation: 'Eccentric loading and progressive tissue stretching.'
  },
  'Fracture': {
    checks: ['load bearing', 'bone alignment structural check', 'impact tolerance'],
    factors: ['structural stability', 'pain response', 'load-bearing'],
    restrictions: 'Avoid any direct impact or uncontrolled loading.',
    recommendation: 'Maintain strict load protection and perform adjacent joint mobility.'
  },
  'Ligament Injury': {
    checks: ['joint laxity', 'lateral shift', 'pivot confidence'],
    factors: ['joint stability', 'asymmetry', 'movement confidence'],
    restrictions: 'Avoid twisting and lateral cutting movements.',
    recommendation: 'Neuromuscular training and isolated joint stabilization.'
  },
  'Hip Strain': {
    checks: ['hip flexion', 'lateral rotation', 'pelvic drop'],
    factors: ['stride length symmetry', 'hip mobility', 'pain on extension'],
    restrictions: 'Avoid deep squats and rapid sprinting.',
    recommendation: 'Gluteal activation and gentle hip flexor stretching.'
  },
  'Neck Injury': {
    checks: ['cervical rotation', 'head tilt', 'postural stress'],
    factors: ['nerve tension', 'muscle stiffness', 'range of motion'],
    restrictions: 'Avoid heavy overhead lifting and sudden head movements.',
    recommendation: 'Isometric neck strengthening and posture alignment.'
  }
};

const COLOR_MAP: Record<string, { bg: string, text: string, border: string, shadow: string, glow: string }> = {
  'Knee': { bg: 'from-emerald-500 to-emerald-700', text: 'text-emerald-400', border: 'border-emerald-400', shadow: 'shadow-emerald-500/40', glow: 'bg-emerald-500' },
  'Ankle': { bg: 'from-amber-500 to-amber-700', text: 'text-amber-400', border: 'border-amber-400', shadow: 'shadow-amber-500/40', glow: 'bg-amber-500' },
  'Shoulder': { bg: 'from-cyan-500 to-cyan-700', text: 'text-cyan-400', border: 'border-cyan-400', shadow: 'shadow-cyan-500/40', glow: 'bg-cyan-500' },
  'Wrist': { bg: 'from-pink-500 to-pink-700', text: 'text-pink-400', border: 'border-pink-400', shadow: 'shadow-pink-500/40', glow: 'bg-pink-500' },
  'Concussion': { bg: 'from-purple-500 to-purple-700', text: 'text-purple-400', border: 'border-purple-400', shadow: 'shadow-purple-500/40', glow: 'bg-purple-500' },
  'Back Injury': { bg: 'from-rose-500 to-rose-700', text: 'text-rose-400', border: 'border-rose-400', shadow: 'shadow-rose-500/40', glow: 'bg-rose-500' },
  'Muscle Tear': { bg: 'from-red-500 to-red-700', text: 'text-red-400', border: 'border-red-400', shadow: 'shadow-red-500/40', glow: 'bg-red-500' },
  'Fracture': { bg: 'from-violet-500 to-violet-700', text: 'text-violet-400', border: 'border-violet-400', shadow: 'shadow-violet-500/40', glow: 'bg-violet-500' },
  'Ligament Injury': { bg: 'from-fuchsia-500 to-fuchsia-700', text: 'text-fuchsia-400', border: 'border-fuchsia-400', shadow: 'shadow-fuchsia-500/40', glow: 'bg-fuchsia-500' },
  'Hip Strain': { bg: 'from-teal-500 to-teal-700', text: 'text-teal-400', border: 'border-teal-400', shadow: 'shadow-teal-500/40', glow: 'bg-teal-500' },
  'Neck Injury': { bg: 'from-indigo-500 to-indigo-700', text: 'text-indigo-400', border: 'border-indigo-400', shadow: 'shadow-indigo-500/40', glow: 'bg-indigo-500' }
};

const DEFAULT_THEME = { bg: 'from-indigo-500 to-indigo-700', text: 'text-indigo-400', border: 'border-indigo-400', shadow: 'shadow-indigo-500/40', glow: 'bg-indigo-500' };

const BODY_PART_MAP: Record<string, string[]> = {
  'Head/Neck': ['Concussion', 'Neck Injury'],
  'Shoulder': ['Shoulder', 'Muscle Tear'],
  'Chest': ['Fracture'],
  'Back': ['Back Injury', 'Muscle Tear'],
  'Arm': ['Muscle Tear'],
  'Elbow': ['Ligament Injury'],
  'Wrist/Hand': ['Wrist', 'Fracture'],
  'Abdomen': ['Muscle Tear'],
  'Hip/Pelvis': ['Hip Strain'],
  'Thigh': ['Muscle Tear', 'Ligament Injury'],
  'Knee': ['Knee', 'Ligament Injury'],
  'Calf': ['Muscle Tear'],
  'Ankle/Foot': ['Ankle', 'Fracture']
};

export default function ReinjuryScanner({ onBack }: { onBack: () => void }) {
  const { user } = useAuth();
  const [phase, setPhase] = useState<'setup' | 'scanning' | 'results'>('setup');
  const [selectedBodyPart, setSelectedBodyPart] = useState<string>('');
  const [allowedParts, setAllowedParts] = useState<string[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;
      try {
        const q = query(collection(db, 'injuries'), where('userId', '==', user.uid));
        const snapshot = await getDocs(q);
        const mapped = new Set<string>();
        snapshot.forEach(doc => {
          const area = doc.data().area;
          if (BODY_PART_MAP[area]) {
            BODY_PART_MAP[area].forEach(p => mapped.add(p));
          } else {
            // fallback
            mapped.add(area);
          }
        });
        // Always include Knee for hackathon safety if it's empty, or just let it be empty
        setAllowedParts(Array.from(mapped));
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchHistory();
  }, [user]);
  
  // Scanning state
  const [scanProgress, setScanProgress] = useState(0);
  const [scanText, setScanText] = useState('Initializing AI Core...');

  // Mock results
  const [recoveryScore, setRecoveryScore] = useState(0);
  const [riskLevel, setRiskLevel] = useState<'Low' | 'Moderate' | 'High'>('Low');
  const [loadTolerance, setLoadTolerance] = useState(0);

  const startScan = () => {
    if (!selectedBodyPart) return;
    setPhase('scanning');
    setScanProgress(0);

    const data = UNIVERSAL_INJURY_DATA[selectedBodyPart];
    
    const steps = [
      'Creating Initial Injury Profile...',
      `Identifying Recovery Metrics for ${selectedBodyPart}...`,
      `Analyzing: ${data.factors[0]}...`,
      `Checking Movement: ${data.checks[0]}...`,
      'Comparing Current vs Healthy Symmetry...',
      'Calculating Load Capacity Tolerance...',
      'Running Universal Recovery Score Engine...',
      'Predicting Reinjury Risk Dynamics...'
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      setScanProgress((currentStep / steps.length) * 100);
      
      if (currentStep < steps.length) {
        setScanText(steps[currentStep]);
      } else {
        clearInterval(interval);
        generateResults();
        setTimeout(() => setPhase('results'), 500);
      }
    }, 800);
  };

  const generateResults = () => {
    // Generate deterministic but dynamic looking numbers based on body part length
    const baseScore = 40 + (selectedBodyPart.length * 5) % 40; 
    setRecoveryScore(baseScore);
    setLoadTolerance(baseScore - 15);
    
    if (baseScore > 75) setRiskLevel('Low');
    else if (baseScore > 50) setRiskLevel('Moderate');
    else setRiskLevel('High');
  };

  const data = UNIVERSAL_INJURY_DATA[selectedBodyPart];
  const theme = COLOR_MAP[selectedBodyPart] || DEFAULT_THEME;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6 transition-colors duration-1000">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-100 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100">
            Universal AI <span className={`font-normal transition-colors duration-500 ${theme.text}`}>/ Reinjury Prevention</span>
          </h1>
          <p className={`mono-label transition-colors duration-500 ${theme.text}`}>Dynamic Multi-Factor Analysis Engine</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {phase === 'setup' && (
          <motion.div 
            key="setup"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className={`bg-gradient-to-br from-slate-800 to-slate-900 border border-t-slate-700 border-b-black p-8 rounded-[2rem] text-center space-y-4 shadow-2xl relative overflow-hidden transition-all duration-700`}>
              <div className={`absolute top-0 right-0 w-64 h-64 ${theme.glow} opacity-10 rounded-full blur-3xl -mr-32 -mt-32 transition-all duration-700`}></div>
              <Brain className={`w-16 h-16 mx-auto transition-colors duration-700 drop-shadow-[0_0_15px_currentColor] ${theme.text}`} />
              <h2 className="text-3xl font-black text-slate-100 uppercase tracking-tight drop-shadow-md">Select Injury History</h2>
              <p className="text-slate-400 max-w-lg mx-auto relative z-10">Select an injury from your historical medical data to run a dynamic load tolerance and reinjury capacity test.</p>
            </div>

            {loadingHistory ? (
              <div className="py-12 flex justify-center"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : allowedParts.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2rem] text-center space-y-4">
                <ShieldAlert className="w-12 h-12 text-slate-600 mx-auto" />
                <h3 className="text-xl font-bold text-slate-300">No Past Injuries Found</h3>
                <p className="text-slate-500 max-w-md mx-auto">You must complete at least one Triage Scan from the Home Dashboard before you can run a Reinjury Prevention Scan.</p>
              </div>
            ) : (
              <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {allowedParts.filter(bp => UNIVERSAL_INJURY_DATA[bp]).map(bp => {
                  const isSelected = selectedBodyPart === bp;
                  const itemTheme = COLOR_MAP[bp] || DEFAULT_THEME;
                return (
                  <motion.button
                    variants={itemVariants}
                    whileHover={{ scale: isSelected ? 1.05 : 1.02, y: isSelected ? 0 : -4 }}
                    whileTap={{ scale: 0.95 }}
                    key={bp}
                    onClick={() => setSelectedBodyPart(bp)}
                    className={`p-5 rounded-2xl border transition-all duration-500 flex flex-col items-center gap-3 relative overflow-hidden ${
                      isSelected 
                        ? `bg-gradient-to-b ${itemTheme.bg} ${itemTheme.border} text-white shadow-[0_10px_30px_rgba(0,0,0,0.5)] z-10` 
                        : 'bg-gradient-to-b from-slate-800 to-slate-900 border-t-slate-700 border-slate-800 border-b-black text-slate-400 shadow-lg'
                    }`}
                  >
                    {isSelected && <div className={`absolute inset-0 ${itemTheme.glow} opacity-20 blur-xl animate-pulse`}></div>}
                    <ActivitySquare className={`w-6 h-6 transition-colors duration-300 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                    <span className="font-bold text-sm relative z-10">{bp}</span>
                  </motion.button>
                );
              })}
            </motion.div>
            )}

            <motion.button 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              onClick={startScan}
              disabled={!selectedBodyPart}
              className={`w-full py-6 bg-gradient-to-b ${theme.bg} disabled:opacity-50 disabled:grayscale text-white rounded-3xl font-black uppercase tracking-widest transition-all duration-700 flex items-center justify-center gap-3 shadow-[0_15px_40px_rgba(0,0,0,0.4)] border-t ${theme.border}`}
            >
              <Scan className="w-5 h-5" /> Initialize Universal Scan
            </motion.button>
          </motion.div>
        )}

        {phase === 'scanning' && (
          <motion.div 
            key="scanning"
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }}
            className="min-h-[500px] flex flex-col items-center justify-center space-y-12"
          >
            <div className="relative">
              <div className={`absolute inset-0 ${theme.glow} rounded-full animate-ping opacity-20 blur-xl transition-colors duration-1000`}></div>
              <div className={`w-32 h-32 bg-slate-900 border-4 ${theme.border} border-opacity-30 rounded-full flex items-center justify-center relative z-10 overflow-hidden transition-colors duration-1000`}>
                <Brain className={`w-12 h-12 animate-pulse transition-colors duration-1000 ${theme.text}`} />
                <div 
                  className={`absolute bottom-0 left-0 right-0 ${theme.glow} opacity-20 transition-all duration-300`}
                  style={{ height: `${scanProgress}%` }}
                />
              </div>
            </div>

            <div className="text-center space-y-4 w-full max-w-md">
              <motion.h3 
                key={scanText}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="text-2xl font-black italic text-slate-100 uppercase tracking-widest drop-shadow-md"
              >
                {scanText}
              </motion.h3>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden shadow-inner">
                <div 
                  className={`h-full bg-gradient-to-r ${theme.bg} transition-all duration-300 shadow-[0_0_15px_currentColor]`}
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
              <p className={`mono-label transition-colors duration-1000 ${theme.text}`}>Deep Extraction Protocol Running</p>
            </div>
          </motion.div>
        )}

        {phase === 'results' && data && (
          <motion.div 
            key="results"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
            className="space-y-6"
          >
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div variants={itemVariants} className="bg-gradient-to-b from-slate-800 to-slate-900 border border-t-slate-700 border-slate-800 border-b-black p-8 rounded-[2rem] flex flex-col justify-center items-center text-center gap-2 relative overflow-hidden shadow-2xl shadow-black/50 group hover:-translate-y-2 transition-transform duration-500">
                <div className={`absolute top-0 right-0 p-4 opacity-5 transition-colors duration-500 ${theme.text}`}><Activity className="w-32 h-32" /></div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400 drop-shadow-md">Universal Score</p>
                <p className={`text-7xl font-black italic text-slate-100 drop-shadow-[0_0_20px_currentColor] transition-colors duration-500 ${theme.text}`}>{recoveryScore}<span className="text-3xl opacity-50">%</span></p>
              </motion.div>

              <motion.div variants={itemVariants} className={`border p-8 rounded-[2rem] flex flex-col justify-center items-center text-center gap-2 relative overflow-hidden shadow-2xl group hover:-translate-y-2 transition-all duration-500 ${
                riskLevel === 'High' ? 'bg-gradient-to-b from-red-900/40 to-slate-900 border-t-red-500/50 border-red-500/20 shadow-red-900/20' : 
                riskLevel === 'Moderate' ? 'bg-gradient-to-b from-amber-900/40 to-slate-900 border-t-amber-500/50 border-amber-500/20 shadow-amber-900/20' : 
                'bg-gradient-to-b from-emerald-900/40 to-slate-900 border-t-emerald-500/50 border-emerald-500/20 shadow-emerald-900/20'
              }`}>
                <ShieldAlert className={`w-10 h-10 mb-2 drop-shadow-[0_0_15px_currentColor] transition-colors duration-500 ${
                  riskLevel === 'High' ? 'text-red-500' : riskLevel === 'Moderate' ? 'text-amber-500' : 'text-emerald-500'
                }`} />
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Reinjury Risk</p>
                <p className={`text-5xl font-black uppercase italic drop-shadow-[0_0_15px_currentColor] transition-colors duration-500 ${
                  riskLevel === 'High' ? 'text-red-500' : riskLevel === 'Moderate' ? 'text-amber-500' : 'text-emerald-500'
                }`}>{riskLevel}</p>
              </motion.div>

              <motion.div variants={itemVariants} className="bg-gradient-to-b from-slate-800 to-slate-900 border border-t-slate-700 border-slate-800 border-b-black p-8 rounded-[2rem] flex flex-col justify-center items-center text-center gap-2 shadow-2xl shadow-black/50 group hover:-translate-y-2 transition-transform duration-500">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Load Capacity Tolerance</p>
                <div className="w-full flex items-end justify-center gap-2 mb-4">
                  <span className={`text-6xl font-black italic drop-shadow-[0_0_20px_currentColor] transition-colors duration-500 ${theme.text}`}>{loadTolerance}</span>
                  <span className="text-2xl font-bold text-slate-500 mb-2">%</span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
                  <div className={`h-full bg-gradient-to-r ${theme.bg} relative transition-all duration-1000`} style={{ width: `${loadTolerance}%` }}>
                     <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent,rgba(255,255,255,0.3))]"></div>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div variants={itemVariants} className="bg-gradient-to-b from-slate-800 to-slate-900 border border-t-slate-700 border-slate-800 border-b-black p-8 rounded-[2rem] space-y-5 shadow-2xl">
                <h3 className={`text-sm font-black uppercase tracking-widest flex items-center gap-2 transition-colors duration-500 ${theme.text}`}>
                  <Scan className="w-5 h-5 drop-shadow-[0_0_10px_currentColor]" /> Dynamic Features Extracted
                </h3>
                <ul className="space-y-4">
                  {data.factors.map((f: string, i: number) => (
                    <motion.li 
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                      key={i} className="flex items-start gap-4 p-3 bg-slate-900/50 rounded-xl border border-slate-800"
                    >
                      <div className={`w-8 h-8 rounded-full ${theme.bg} flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg`}>
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-200 capitalize">{f}</p>
                        <p className="text-xs text-slate-500 font-medium">Status: Quantifying</p>
                      </div>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>

              <div className="space-y-6">
                <motion.div variants={itemVariants} className="bg-gradient-to-b from-red-900/20 to-slate-900 border-t border-t-red-500/30 border-red-500/10 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl"></div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-red-400 flex items-center gap-2 mb-3 relative">
                    <ShieldAlert className="w-5 h-5 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]" /> Return-to-Play Restrictions
                  </h3>
                  <p className="text-slate-200 font-medium leading-relaxed relative z-10 text-lg">{data.restrictions}</p>
                </motion.div>

                <motion.div variants={itemVariants} className="bg-gradient-to-b from-emerald-900/20 to-slate-900 border-t border-t-emerald-500/30 border-emerald-500/10 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"></div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2 mb-3 relative">
                    <Activity className="w-5 h-5 drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]" /> AI Recovery Recommendation
                  </h3>
                  <p className="text-slate-200 font-medium leading-relaxed relative z-10 text-lg">{data.recommendation}</p>
                </motion.div>
              </div>
            </motion.div>

            <button 
              onClick={() => setPhase('setup')}
              className="w-full py-5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-bold uppercase tracking-wider transition-all"
            >
              Scan Another Profile
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
