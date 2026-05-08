import React, { useState } from 'react';
import RecoveryPlanner from '../components/RecoveryPlanner';
import { RecoveryPlan } from '../types';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Activity, ArrowLeft, FileText, ClipboardList, ShieldCheck, BarChart3, TrendingDown, TrendingUp } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { motion } from 'motion/react';

interface RecoveryProps {
  plan: RecoveryPlan;
  onBack: () => void;
}

const Recovery: React.FC<RecoveryProps> = ({ plan, onBack }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'planner' | 'report'>('dashboard');

  const handleStepToggle = async (day: number) => {
    try {
      const updatedSteps = plan.planSteps.map(s => 
        s.day === day ? { ...s, completed: !s.completed } : s
      );
      
      const planRef = doc(db, 'recoveryPlans', plan.id);
      await updateDoc(planRef, {
        planSteps: updatedSteps
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `recoveryPlans/${plan.id}`);
    }
  };

  return (
    <div className="space-y-8 py-4 pb-20">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-100 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-black italic tracking-tighter uppercase text-slate-100">
          Recovery <span className="text-indigo-500">Command</span>
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-900/50 p-1 rounded-2xl border border-slate-800 overflow-x-auto custom-scrollbar">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Tracker
        </button>
        <button 
          onClick={() => setActiveTab('planner')}
          className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            activeTab === 'planner' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Protocol
        </button>
        <button 
          onClick={() => setActiveTab('report')}
          className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            activeTab === 'report' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <FileText className="w-4 h-4" />
          Report
        </button>
      </div>

      {activeTab === 'dashboard' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
           <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
                 <p className="mono-label !text-slate-400 mb-2">Pain Score (0-10)</p>
                 <div className="flex items-end gap-2">
                    <span className="text-4xl font-black italic text-emerald-400">3.2</span>
                    <span className="text-sm font-bold text-slate-500 mb-1">/ 10</span>
                 </div>
                 <div className="flex items-center gap-1 mt-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 w-max px-2 py-1 rounded-lg">
                    <TrendingDown className="w-3 h-3" /> 2.1 from baseline
                 </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
                 <p className="mono-label !text-slate-400 mb-2">Overall Mobility</p>
                 <div className="flex items-end gap-2">
                    <span className="text-4xl font-black italic text-indigo-400">68%</span>
                 </div>
                 <div className="flex items-center gap-1 mt-2 text-xs font-bold text-indigo-400 bg-indigo-500/10 w-max px-2 py-1 rounded-lg">
                    <TrendingUp className="w-3 h-3" /> 14% improvement
                 </div>
              </div>
           </div>

           <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6">
              <h3 className="text-xl font-black italic uppercase tracking-tighter">Biomarker Tracking</h3>
              
              <div className="space-y-4">
                 <div className="space-y-2">
                    <div className="flex justify-between text-sm font-bold">
                       <span className="text-slate-300">Swelling Reduction</span>
                       <span className="text-emerald-400">85% cleared</span>
                    </div>
                    <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                       <motion.div initial={{ width: 0 }} animate={{ width: '85%' }} transition={{ duration: 1 }} className="h-full bg-emerald-500 rounded-full" />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <div className="flex justify-between text-sm font-bold">
                       <span className="text-slate-300">Bruise Healing</span>
                       <span className="text-emerald-400">60% cleared</span>
                    </div>
                    <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                       <motion.div initial={{ width: 0 }} animate={{ width: '60%' }} transition={{ duration: 1, delay: 0.2 }} className="h-full bg-emerald-500 rounded-full" />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <div className="flex justify-between text-sm font-bold">
                       <span className="text-slate-300">ROM (Range of Motion)</span>
                       <span className="text-indigo-400">70% restored</span>
                    </div>
                    <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                       <motion.div initial={{ width: 0 }} animate={{ width: '70%' }} transition={{ duration: 1, delay: 0.4 }} className="h-full bg-indigo-500 rounded-full" />
                    </div>
                 </div>
              </div>
           </div>
        </motion.div>
      )}

      {activeTab === 'planner' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          <div className="bg-indigo-600 p-6 rounded-3xl text-white shadow-xl flex items-center justify-between overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
               <Activity className="w-24 h-24 stroke-[4]" />
            </div>
            <div className="relative">
               <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-1">Target</p>
               <h2 className="text-3xl font-black italic tracking-tighter uppercase">Road to Return</h2>
            </div>
            <div className="relative text-right">
               <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-1">Status</p>
               <h2 className="text-3xl font-black italic tracking-tighter uppercase">On Track</h2>
            </div>
          </div>
          <RecoveryPlanner plan={plan} onStepToggle={handleStepToggle} />
        </motion.div>
      )}

      {activeTab === 'report' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-6">
              <div>
                <h2 className="text-2xl font-black italic tracking-tighter uppercase text-slate-100">Full Analysis <span className="text-indigo-500">Report</span></h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">Generated by Bio-Logic AI Core</p>
              </div>
              <ShieldCheck className="w-10 h-10 text-emerald-500" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Clinical Assessment</h4>
                 <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-800 space-y-3">
                   <p className="text-sm font-medium text-slate-300 leading-relaxed italic">
                     Biomechanical review suggests a standard healing trajectory for competitive athletes. No structural instability detected in primary imaging.
                   </p>
                 </div>
              </div>
              <div className="space-y-4">
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-teal-400">Biological Markers</h4>
                 <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs">
                    <div className="flex justify-between border-b border-slate-700/50 pb-2">
                       <span className="text-slate-500">Inflammation Index</span>
                       <span className="text-teal-400 font-bold">OPTIMIZED</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-700/50 pb-2">
                       <span className="text-slate-500">Nerve Conductance</span>
                       <span className="text-teal-400 font-bold">NORMAL</span>
                    </div>
                    <div className="flex justify-between pt-1">
                       <span className="text-slate-500">Recovery Velocity</span>
                       <span className="text-teal-400 font-bold">ALPHA (ELITE)</span>
                    </div>
                 </div>
              </div>
            </div>

            <div className="space-y-4 pt-4">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Athletic Prevention Protocol</h4>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {plan.preventionTips.map((tip, i) => (
                   <div key={i} className="flex gap-4 p-4 bg-slate-800/20 border border-slate-800 rounded-2xl">
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 shrink-0" />
                      <p className="text-xs font-semibold text-slate-300">{tip}</p>
                   </div>
                 ))}
               </div>
            </div>

            <button 
              onClick={() => window.print()}
              className="w-full py-4 bg-slate-800 border border-slate-700 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-300 hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Download Official PDF Report
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Recovery;
