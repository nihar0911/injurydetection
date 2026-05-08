import React from 'react';
import { ShieldAlert, CheckCircle, Activity, ChevronRight, AlertTriangle, Crosshair, Scan } from 'lucide-react';
import { motion } from 'motion/react';

interface TriageResultProps {
  result: {
    diagnosis: string;
    probability: number;
    riskLevel: 'low' | 'medium' | 'high' | 'emergency';
    severityScore: number;
    movementDecision: string;
    extractedFeatures: string[];
    plan: string[];
    originalImage?: string;
    aiModelImage?: string;
  };
  onProceed: () => void;
}

const TriageResult: React.FC<TriageResultProps> = ({ result, onProceed }) => {
  const isEmergency = result.riskLevel === 'emergency';

  const riskColors = {
    low: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    high: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    emergency: 'text-red-500 bg-red-500/10 border-red-500/30'
  };

  const scoreColor = 
    result.severityScore >= 76 ? 'text-red-500' : 
    result.severityScore >= 51 ? 'text-orange-400' : 
    result.severityScore >= 26 ? 'text-amber-400' : 'text-emerald-400';

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      {isEmergency && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-red-500 rounded-3xl p-6 text-white shadow-[0_0_40px_rgba(239,68,68,0.4)] border border-red-400"
        >
          <div className="flex items-center gap-4 mb-4">
            <AlertTriangle className="w-12 h-12 animate-pulse" />
            <div>
              <h2 className="text-2xl font-black uppercase italic tracking-tighter">Emergency Escalation</h2>
              <p className="font-bold text-red-100">DO NOT MOVE. Immediate medical attention required.</p>
            </div>
          </div>
          <div className="bg-red-950/40 rounded-xl p-4 space-y-2">
            <p className="font-bold text-sm">CRITICAL INSTRUCTIONS:</p>
            <ul className="list-disc list-inside space-y-1 text-sm font-medium">
              <li>Keep the athlete completely still.</li>
              <li>Do not attempt to realign any deformity.</li>
              <li>Seek emergency medical transport immediately.</li>
            </ul>
          </div>
        </motion.div>
      )}

      {/* Side-by-Side Model Images */}
      {result.originalImage && result.aiModelImage && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
             <div className="flex items-center gap-2">
               <Scan className="w-4 h-4 text-emerald-400" />
               <h3 className="mono-label !text-emerald-400">Captured Detection</h3>
             </div>
             <img src={result.originalImage} alt="Detected heatmap" className="w-full h-auto aspect-video object-cover rounded-3xl border-2 border-emerald-500/20 shadow-xl" />
          </div>
          <div className="space-y-3">
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-2">
                 <Crosshair className="w-4 h-4 text-indigo-400" />
                 <h3 className="mono-label !text-indigo-400">Deep Tissue AI Model</h3>
               </div>
               <span className="text-[9px] px-2 py-0.5 rounded bg-indigo-500 text-white font-bold uppercase tracking-widest animate-pulse">Generated</span>
             </div>
             <img src={result.aiModelImage} alt="Deep tissue model" className="w-full h-auto aspect-video object-cover rounded-3xl border-2 border-indigo-500/40 shadow-xl shadow-indigo-500/20" />
          </div>
        </motion.div>
      )}

      {/* Explainable AI Dashboard */}
      <div className="glass-panel p-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black italic tracking-tighter uppercase text-slate-100 flex items-center gap-2">
            <Activity className="w-6 h-6 text-indigo-500" />
            AI Diagnostic <span className="text-indigo-500">Output</span>
          </h2>
          <div className={`px-4 py-1 rounded-full border ${riskColors[result.riskLevel]} font-bold text-xs uppercase tracking-widest`}>
            {result.riskLevel} RISK
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Gauge & Interpretation */}
          <div className="space-y-4">
             <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5"><Crosshair className="w-24 h-24" /></div>
                <p className="mono-label mb-2">Severity Score</p>
                <div className="flex items-end justify-center gap-1">
                  <span className={`text-6xl font-black italic leading-none ${scoreColor}`}>{result.severityScore}</span>
                  <span className="text-slate-500 font-bold mb-2">/100</span>
                </div>
                <p className="mt-4 text-sm font-bold text-slate-300">Decision: <span className="text-indigo-400">{result.movementDecision}</span></p>
             </div>
             
             <div className="bg-slate-900/50 rounded-2xl p-4 border border-slate-800">
               <p className="mono-label mb-1">AI Interpretation</p>
               <p className="font-bold text-lg text-slate-200">{result.diagnosis}</p>
               <div className="mt-2 flex items-center gap-2">
                 <div className="h-1.5 flex-1 bg-slate-800 rounded-full overflow-hidden">
                   <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${result.probability}%` }} />
                 </div>
                 <span className="text-xs font-bold text-indigo-400">{result.probability}% Confidence</span>
               </div>
             </div>
          </div>

          {/* Extracted Features */}
          <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800">
            <p className="mono-label mb-4">Detected Findings</p>
            <div className="space-y-3">
              {result.extractedFeatures.slice(0, 5).map((f, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm font-medium text-slate-300 capitalize">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* First 5-Min Response */}
        <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-2xl p-6 relative overflow-hidden">
           <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
           <p className="mono-label !text-indigo-400 mb-4">First 5-Minute Response Protocol</p>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
             {result.plan.map((step, idx) => (
               <div key={idx} className="bg-slate-900/50 p-3 rounded-xl border border-slate-800 flex items-center gap-3">
                 <div className="w-6 h-6 rounded bg-indigo-500/20 text-indigo-400 text-xs font-bold flex items-center justify-center">{idx + 1}</div>
                 <span className="text-sm font-medium text-slate-200">{step}</span>
               </div>
             ))}
           </div>
        </div>
      </div>

      <button 
        onClick={onProceed}
        className={`w-full py-5 rounded-2xl font-bold italic tracking-tighter uppercase text-xl transition-all shadow-2xl flex items-center justify-center gap-3 ${
          isEmergency 
            ? 'bg-red-500 text-white hover:bg-red-400 shadow-red-500/30' 
            : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-600/30'
        }`}
      >
        {isEmergency ? 'Acknowledge Emergency' : 'Generate Recovery Plan'} <ChevronRight className="w-6 h-6" />
      </button>
    </div>
  );
};

export default TriageResult;
