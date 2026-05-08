import React from 'react';
import { Calendar, CheckCircle2, ChevronRight, Info, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { RecoveryPlan } from '../types';

interface RecoveryPlannerProps {
  plan: RecoveryPlan;
  onStepToggle: (stepDay: number) => void;
}

const RecoveryPlanner: React.FC<RecoveryPlannerProps> = ({ plan, onStepToggle }) => {
  const currentDay = Math.floor((Date.now() - plan.startDate.toDate().getTime()) / (1000 * 60 * 60 * 24)) + 1;

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black italic tracking-tighter uppercase text-slate-100 flex items-center gap-3">
          <Star className="text-indigo-500 fill-indigo-500/20 w-8 h-8" />
          Recovery Path
        </h2>
        <div className="bg-indigo-600 text-white px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20">
          Day {currentDay}
        </div>
      </div>

      <div className="space-y-4 relative">
        <div className="absolute left-6 top-0 bottom-0 w-px bg-slate-800" />
        {plan.planSteps.map((step, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`group rounded-2xl border-2 p-6 transition-all relative z-10 ${
              step.completed 
                ? 'bg-emerald-500/5 border-emerald-500/20 opacity-60' 
                : step.day === currentDay 
                  ? 'bg-slate-900 border-indigo-500 shadow-2xl scale-[1.02]' 
                  : 'bg-slate-900/50 border-slate-800'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-6">
                <div className={`w-14 h-14 shrink-0 rounded-xl flex flex-col items-center justify-center font-mono font-black border-2 transition-colors ${
                  step.completed 
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400' 
                    : step.day === currentDay 
                      ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/20' 
                      : 'bg-slate-800 border-slate-700 text-slate-500'
                }`}>
                  <span className="text-[10px] uppercase tracking-widest opacity-80 mb-0.5">Day</span>
                  <span className="text-xl leading-none">{step.day < 10 ? `0${step.day}` : step.day}</span>
                </div>
                <div className="pt-1">
                  <div className="flex items-center gap-3 mb-1">
                    <p className={`font-black italic tracking-tighter uppercase text-xl ${step.completed ? 'text-emerald-400/50 line-through' : 'text-slate-100'}`}>
                      {step.action}
                    </p>
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${
                      step.day === currentDay ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-500'
                    }`}>
                      {step.day === currentDay ? 'Primary Objective' : 'Phase ' + Math.ceil(step.day / 3)}
                    </span>
                  </div>
                  <p className={`text-sm leading-relaxed mt-3 font-medium ${step.day === currentDay ? 'text-indigo-100/80' : 'text-slate-400'}`}>
                    {step.details}
                  </p>
                </div>
              </div>
              
              <button 
                onClick={() => onStepToggle(step.day)}
                className={`w-12 h-12 shrink-0 rounded-full border-2 flex items-center justify-center transition-all hover:scale-105 active:scale-95 ${
                  step.completed 
                    ? 'bg-emerald-500 border-emerald-400 text-white' 
                    : 'bg-slate-800/50 border-slate-700 text-slate-500 hover:border-indigo-500 hover:text-indigo-400'
                }`}
              >
                {step.completed ? <CheckCircle2 className="w-6 h-6" /> : <ChevronRight className="w-6 h-6 ml-0.5" />}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <section className="bg-slate-900 rounded-[2rem] p-8 border border-slate-800 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/5 rounded-full -mr-24 -mt-24 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
        <h3 className="mono-label !text-indigo-400 mb-6 flex items-center gap-2">
          <Info className="w-4 h-4" />
          Pro Prevention Logic
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {plan.preventionTips.map((tip, idx) => (
            <div key={idx} className="flex gap-4 items-start">
              <div className="w-6 h-6 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <ChevronRight className="w-3 h-3 text-indigo-500" />
              </div>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">{tip}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default RecoveryPlanner;
