import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BodyPart } from '../types';
import { ChevronDown, RefreshCw } from 'lucide-react';

interface BodyMapProps {
  onPartClick: (part: BodyPart) => void;
  selectedPart?: BodyPart;
}

const REGIONS = {
  Head: ['head', 'forehead', 'eyes', 'nose', 'jaw', 'neck', 'back_head'],
  Arms: ['shoulder_left', 'shoulder_right', 'upper_arm_left', 'upper_arm_right', 'elbow_left', 'elbow_right', 'forearm_left', 'forearm_right', 'wrist_left', 'wrist_right', 'hand_left', 'hand_right', 'fingers', 'tricep_left', 'tricep_right'],
  Torso: ['chest', 'ribs', 'abdomen', 'upper_back', 'spine', 'lower_back', 'shoulder_blade_left', 'shoulder_blade_right'],
  Hips: ['hip', 'groin', 'glute_left', 'glute_right'],
  Legs: ['thigh_left', 'thigh_right', 'knee_left', 'knee_right', 'shin_left', 'shin_right', 'calf_left', 'calf_right', 'hamstring_left', 'hamstring_right', 'back_knee_left', 'back_knee_right'],
  Feet: ['ankle_left', 'ankle_right', 'foot_left', 'foot_right', 'toes', 'achilles_left', 'achilles_right', 'heel_left', 'heel_right']
};

const BodyMap: React.FC<BodyMapProps> = ({ onPartClick, selectedPart }) => {
  const [view, setView] = useState<'front' | 'back'>('front');
  const [expandedRegion, setExpandedRegion] = useState<string | null>('Head');

  const formatPartName = (p: string) => p.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <div className="flex flex-col md:flex-row gap-8 w-full max-w-4xl mx-auto">
      {/* Visual Map Column */}
      <div className="flex-1 flex flex-col items-center">
        <button 
          onClick={() => setView(v => v === 'front' ? 'back' : 'front')}
          className="mb-4 flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-full text-xs font-bold uppercase tracking-widest text-indigo-300 hover:bg-slate-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Switch to {view === 'front' ? 'Back' : 'Front'} View
        </button>
        
        <div className="relative w-full max-w-[280px] aspect-[1/2] bg-slate-900/50 rounded-3xl border border-slate-800 p-4 shadow-2xl overflow-hidden flex justify-center">
           <svg viewBox="0 0 200 400" className="w-full h-full drop-shadow-2xl" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M100,20 C110,20 120,30 120,50 C120,70 110,80 100,80 C90,80 80,70 80,50 C80,30 90,20 100,20 M80,85 L120,85 L140,110 L140,200 L120,200 L120,130 L110,130 L110,240 L130,350 L110,350 L100,250 L90,350 L70,350 L90,240 L90,130 L80,130 L80,200 L60,200 L60,110 Z"
                fill="#1e293b"
                stroke="#334155"
                strokeWidth="2"
                className="transition-colors duration-300"
              />
              {/* Highlight Overlay based on selected region */}
              {expandedRegion === 'Head' && <circle cx="100" cy="50" r="30" fill="rgba(99, 102, 241, 0.3)" className="animate-pulse" />}
              {expandedRegion === 'Arms' && (
                <>
                  <rect x="50" y="110" width="30" height="90" rx="10" fill="rgba(99, 102, 241, 0.3)" className="animate-pulse" />
                  <rect x="120" y="110" width="30" height="90" rx="10" fill="rgba(99, 102, 241, 0.3)" className="animate-pulse" />
                </>
              )}
              {expandedRegion === 'Torso' && <rect x="80" y="85" width="40" height="110" rx="10" fill="rgba(99, 102, 241, 0.3)" className="animate-pulse" />}
              {expandedRegion === 'Hips' && <rect x="80" y="195" width="40" height="30" rx="10" fill="rgba(99, 102, 241, 0.3)" className="animate-pulse" />}
              {expandedRegion === 'Legs' && (
                <>
                  <rect x="75" y="225" width="20" height="120" rx="10" fill="rgba(99, 102, 241, 0.3)" className="animate-pulse" />
                  <rect x="105" y="225" width="20" height="120" rx="10" fill="rgba(99, 102, 241, 0.3)" className="animate-pulse" />
                </>
              )}
              {expandedRegion === 'Feet' && (
                <>
                  <circle cx="85" cy="355" r="15" fill="rgba(99, 102, 241, 0.3)" className="animate-pulse" />
                  <circle cx="115" cy="355" r="15" fill="rgba(99, 102, 241, 0.3)" className="animate-pulse" />
                </>
              )}
           </svg>
        </div>
      </div>

      {/* Detail List Column */}
      <div className="flex-1 space-y-2 h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Select Specific Injury Area</p>
        
        {Object.entries(REGIONS).map(([region, parts]) => (
          <div key={region} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <button 
              onClick={() => setExpandedRegion(expandedRegion === region ? null : region)}
              className="w-full px-4 py-4 flex items-center justify-between text-left hover:bg-slate-800/50 transition-colors"
            >
              <span className="font-bold text-slate-200">{region}</span>
              <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform ${expandedRegion === region ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {expandedRegion === region && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-4 pb-4 overflow-hidden"
                >
                  <div className="flex flex-wrap gap-2 mt-2">
                    {parts.map(p => {
                      const isFrontPart = !p.includes('back') && !p.includes('glute') && !p.includes('spine') && !p.includes('tricep') && !p.includes('hamstring') && !p.includes('achilles') && !p.includes('heel');
                      const showInCurrentView = (view === 'front' && isFrontPart) || (view === 'back' && !isFrontPart) || (p === 'neck' || p === 'head' || p.includes('shoulder'));
                      
                      if (!showInCurrentView) return null;

                      return (
                        <button
                          key={p}
                          onClick={() => onPartClick(p as BodyPart)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${selectedPart === p ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'}`}
                        >
                          {formatPartName(p)}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BodyMap;
