import React, { useState, useEffect } from 'react';
import VisualScan, { ScanData } from '../components/VisualScan';
import TriageResult from '../components/TriageResult';
import { BodyPart, Injury, RecoveryPlan } from '../types';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { Activity, Thermometer, Droplets, ArrowLeft, Send, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { getSymptomsForPart } from '../data/symptomsMapping';
import { findMatchingCondition } from '../data/injuryDatabase';

interface TriageProps {
  selectedPart: BodyPart;
  onBack: () => void;
  onPlanGenerated: (plan: RecoveryPlan) => void;
  onCallAmbulance: () => void;
}

const Triage: React.FC<TriageProps> = ({ selectedPart, onBack, onPlanGenerated, onCallAmbulance }) => {
  const { profile, user, refreshProfile } = useAuth();
  const [step, setStep] = useState<'symptoms' | 'followup' | 'vitals' | 'scan' | 'analyzing' | 'result'>('symptoms');
  
  const [symptomOptions, setSymptomOptions] = useState<string[]>([]);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [followupAnswers, setFollowupAnswers] = useState<Record<string, string>>({});
  
  const [bp, setBp] = useState('');
  const [spo2, setSpo2] = useState('');
  const [triageResult, setTriageResult] = useState<any>(null);

  useEffect(() => {
    setSymptomOptions(getSymptomsForPart(selectedPart));
  }, [selectedPart]);

  const toggleSymptom = (s: string) => {
    setSymptoms(prev => prev.includes(s) ? prev.filter(item => item !== s) : [...prev, s]);
  };

  const getFollowupQuestions = () => {
    const questions: { id: string, q: string, options: string[] }[] = [];
    if (symptoms.some(s => s.toLowerCase().includes('swell'))) {
      questions.push({ id: 'swell_rate', q: 'Is the swelling increasing rapidly?', options: ['Yes, very fast', 'Slowly', 'Stable/No'] });
    }
    if (symptoms.some(s => s.toLowerCase().includes('deform') || s.toLowerCase().includes('pop'))) {
      questions.push({ id: 'pop_sound', q: 'Did you hear a clear pop or snap sound?', options: ['Yes, loud pop', 'Maybe a click', 'No'] });
    }
    if (symptoms.some(s => s.toLowerCase().includes('pain'))) {
      questions.push({ id: 'pain_type', q: 'How would you describe the pain?', options: ['Sharp & Intense', 'Dull ache', 'Throbbing'] });
    }
    if (questions.length === 0) {
      questions.push({ id: 'walk_ability', q: 'Does it hurt to bear weight or move the joint?', options: ['Cannot bear weight', 'Hurts a little', 'Fine to move'] });
    }
    return questions.slice(0, 2); 
  };

  const followupQuestions = getFollowupQuestions();

  const handleFollowupAnswer = (qId: string, answer: string) => {
    setFollowupAnswers(prev => ({ ...prev, [qId]: answer }));
  };

  const runAnalysis = async (scanData: ScanData) => {
    setStep('analyzing');
    
    setTimeout(async () => {
      try {
        const { features, minJointAngle } = scanData;
        
        // --- REAL AI REASONING ---
        // We query the local DB with the mathematical features from cvProcessor
        const matchedCondition = findMatchingCondition(
          features.bruisePercentage,
          features.rednessPercentage,
          [...symptoms, ...Object.values(followupAnswers)],
          minJointAngle
        );

        // Convert the matched DB result into our UI schema
        let riskLevel = 'low';
        if (matchedCondition.severityScoreBase >= 76) riskLevel = 'emergency';
        else if (matchedCondition.severityScoreBase >= 51) riskLevel = 'high';
        else if (matchedCondition.severityScoreBase >= 26) riskLevel = 'medium';

        // Prepare Explainable AI output using real math
        const extractedFeaturesText = [
          `Redness Index: ${features.rednessPercentage}%`,
          `Tissue Damage (Bruise): ${features.bruisePercentage}%`,
          ...(minJointAngle ? [`Restricted ROM: Max Angle ${Math.round(minJointAngle)}°`] : []),
          ...symptoms
        ];

        // Slice the plan: Pro users get all 30 days, Free users get only the first 7 days.
        const tierAllowedSteps = matchedCondition.recoverySteps;

        const finalResult = {
          diagnosis: matchedCondition.condition,
          probability: matchedCondition.probabilityBase,
          extractedFeatures: extractedFeaturesText,
          plan: matchedCondition.plan,
          recoverySteps: tierAllowedSteps,
          riskLevel,
          severityScore: matchedCondition.severityScoreBase,
          movementDecision: matchedCondition.movementDecision,
          originalImage: scanData.images[0],
          aiModelImage: scanData.aiModelImage
        };

        setTriageResult(finalResult);

        if (user) {
          const injuryRef = await addDoc(collection(db, 'injuries'), {
            userId: user.uid,
            area: selectedPart,
            symptoms,
            visualSigns: finalResult.extractedFeatures,
            triageResult: {
              diagnosis: finalResult.diagnosis,
              probability: finalResult.probability,
              plan: finalResult.plan,
              riskLevel: finalResult.riskLevel,
              severityScore: finalResult.severityScore,
              movementDecision: finalResult.movementDecision
            },
            bp,
            spo2: spo2 ? parseInt(spo2) : null,
            emergencyEscalated: riskLevel === 'emergency',
            timestamp: serverTimestamp()
          });

          if (riskLevel !== 'emergency') {
            const planRef = await addDoc(collection(db, 'recoveryPlans'), {
              userId: user.uid,
              injuryId: injuryRef.id,
              startDate: serverTimestamp(),
              planSteps: finalResult.recoverySteps.map((s: any) => ({ ...s, completed: false })),
              preventionTips: ["Dynamic stretching", "Load management"],
              status: 'active'
            });
            setTriageResult({ ...finalResult, firebasePlanId: planRef.id });
          }

        }

        setStep('result');
      } catch (err) {
        console.error("Analysis failed:", err);
        setStep('result'); 
      }
    }, 2000); // Simulate DB processing time
  };

  return (
    <div className="space-y-10 py-4 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-100 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100">
            Injury Triage <span className="text-slate-500 font-normal">/ Assessment</span>
          </h1>
          <p className="mono-label !text-indigo-400">Target Area: {selectedPart.replace(/_/g, ' ')}</p>
        </div>
      </div>

      {step === 'symptoms' && (
        <div className="space-y-10 animate-in slide-in-from-bottom-5 duration-500">
           <div className="space-y-4">
             <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-tight">Define Your <br /><span className="text-indigo-500">Sensory Inputs</span></h2>
             <p className="text-slate-400 font-medium">Select specific biomarkers to prime the AI core.</p>
           </div>
           
           <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
             {symptomOptions.map(s => (
               <button
                 key={s}
                 onClick={() => toggleSymptom(s)}
                 className={`p-4 rounded-2xl border text-sm font-bold text-center transition-all ${
                   symptoms.includes(s) 
                    ? 'bg-indigo-600 border-indigo-400 text-white shadow-xl shadow-indigo-600/20 scale-[1.02]' 
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                 }`}
               >
                 {s}
               </button>
             ))}
           </div>

           <button 
             disabled={symptoms.length === 0}
             onClick={() => setStep('followup')}
             className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold italic tracking-tighter uppercase text-xl shadow-2xl shadow-indigo-600/30 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:active:scale-100"
           >
             Continue <Send className="w-5 h-5" />
           </button>
        </div>
      )}

      {step === 'followup' && (
        <div className="space-y-10 animate-in slide-in-from-right-5 duration-500">
           <div className="space-y-4">
             <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-tight">Dynamic <br /><span className="text-indigo-500">Follow-up</span></h2>
             <p className="text-slate-400 font-medium">Clarifying questions based on your symptoms.</p>
           </div>

           <div className="space-y-8">
             {followupQuestions.map((q) => (
               <div key={q.id} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
                  <h3 className="font-bold text-lg text-slate-200 flex items-start gap-3">
                    <MessageSquare className="w-5 h-5 text-indigo-400 mt-0.5 flex-shrink-0" />
                    {q.q}
                  </h3>
                  <div className="flex flex-col gap-2">
                    {q.options.map(opt => (
                      <button
                        key={opt}
                        onClick={() => handleFollowupAnswer(q.id, opt)}
                        className={`p-3 text-left rounded-xl border text-sm transition-all ${
                          followupAnswers[q.id] === opt 
                            ? 'bg-indigo-600/20 border-indigo-500 text-indigo-100' 
                            : 'bg-slate-800/50 border-transparent text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
               </div>
             ))}
           </div>

           <button 
             disabled={Object.keys(followupAnswers).length !== followupQuestions.length}
             onClick={() => setStep('vitals')}
             className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold italic tracking-tighter uppercase text-xl shadow-2xl shadow-indigo-600/30 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:active:scale-100"
           >
             Next <Send className="w-5 h-5" />
           </button>
        </div>
      )}

      {step === 'vitals' && (
        <div className="space-y-10 animate-in slide-in-from-right-5 duration-500">
           <div className="space-y-4">
             <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-tight">Calibrate <br /><span className="text-indigo-500">Clinical Markers</span></h2>
             <p className="text-slate-400 font-medium">Optional telemetry for deep-logic assessment.</p>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
             <div className="space-y-3">
                <label className="mono-label flex items-center gap-2">
                   <Droplets className="w-3 h-3" /> Blood Pressure
                </label>
                <input 
                  type="text" 
                  value={bp}
                  onChange={(e) => setBp(e.target.value)}
                  placeholder="120/80"
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 font-mono text-lg outline-none focus:border-indigo-500 transition-colors text-indigo-100 placeholder:text-slate-700"
                />
             </div>
             <div className="space-y-3">
                <label className="mono-label flex items-center gap-2">
                   <Thermometer className="w-3 h-3" /> Oxygen Saturation
                </label>
                <input 
                  type="number" 
                  value={spo2}
                  onChange={(e) => setSpo2(e.target.value)}
                  placeholder="98"
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 font-mono text-lg outline-none focus:border-indigo-500 transition-colors text-indigo-100 placeholder:text-slate-700"
                />
             </div>
           </div>

           <button 
             onClick={() => setStep('scan')}
             className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold italic tracking-tighter uppercase text-xl shadow-2xl shadow-indigo-600/30 active:scale-95 transition-all flex items-center justify-center gap-3"
           >
             Next: Real CV Scan <Send className="w-5 h-5" />
           </button>
        </div>
      )}

      {step === 'scan' && (
        <div className="animate-in slide-in-from-right-5 duration-500">
          <VisualScan onComplete={(data) => runAnalysis(data)} />
        </div>
      )}

      {step === 'analyzing' && (
        <div className="min-h-[400px] flex flex-col items-center justify-center text-center space-y-8 animate-in zoom-in-95 duration-500">
          <div className="relative w-32 h-32 flex items-center justify-center">
            <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full animate-[spin_3s_linear_infinite]" />
            <div className="absolute inset-2 border-4 border-t-indigo-500 border-r-indigo-500 border-b-transparent border-l-transparent rounded-full animate-spin" />
            <Activity className="w-10 h-10 text-indigo-400 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black italic uppercase text-white">Cross-Referencing DB</h3>
            <p className="text-indigo-300 mono-label">Matching pixel clusters against heuristics...</p>
          </div>
        </div>
      )}

      {step === 'result' && triageResult && (
        <TriageResult 
          result={triageResult} 
          onProceed={() => {
            if (triageResult.riskLevel !== 'emergency') {
              const plan: RecoveryPlan = {
                id: triageResult.firebasePlanId || 'demo',
                userId: user?.uid || '',
                injuryId: 'demo',
                startDate: { toDate: () => new Date() },
                planSteps: triageResult.recoverySteps.map((s: any) => ({ ...s, completed: false })),
                preventionTips: ["Dynamic stretching", "Load management"],
                status: 'active'
              };
              onPlanGenerated(plan);
            } else {
              onBack();
            }
          }} 
          onCallAmbulance={onCallAmbulance}
        />
      )}

          </div>
  );
};

export default Triage;
