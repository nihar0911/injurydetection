/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import Triage from './pages/Triage';
import Recovery from './pages/Recovery';
import AmbulanceTracker from './pages/AmbulanceTracker';
import ReinjuryScanner from './pages/ReinjuryScanner';
import { BodyPart, RecoveryPlan } from './types';
import { motion, AnimatePresence } from 'motion/react';

const pageVariants = {
  initial: { opacity: 0, y: 40, filter: 'blur(15px)', scale: 0.95 },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)', scale: 1, transition: { type: 'spring', stiffness: 260, damping: 20 } },
  exit: { opacity: 0, y: -40, filter: 'blur(15px)', scale: 1.05, transition: { duration: 0.3 } }
};

const AppContent = () => {
  const { user, profile, loading } = useAuth();
  const [view, setView] = useState<'home' | 'triage' | 'recovery' | 'ambulance' | 'reinjury'>('home');
  const [selectedPart, setSelectedPart] = useState<BodyPart | null>(null);
  const [activePlan, setActivePlan] = useState<RecoveryPlan | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (!profile) {
    return <Onboarding />;
  }

  return (
    <Layout>
      <AnimatePresence mode="wait">
        {view === 'home' && (
          <motion.div
            key="home"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <Home 
              onStartTriage={(part) => {
                setSelectedPart(part);
                setView('triage');
              }} 
              onViewRecovery={(plan) => {
                setActivePlan(plan);
                setView('recovery');
              }}
              onStartReinjuryScanner={() => setView('reinjury')}
            />
          </motion.div>
        )}

        {view === 'triage' && selectedPart && (
          <motion.div
            key="triage"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <Triage 
              selectedPart={selectedPart} 
              onBack={() => setView('home')} 
              onPlanGenerated={(plan) => {
                setActivePlan(plan);
                setView('recovery');
              }}
              onCallAmbulance={() => setView('ambulance')}
            />
          </motion.div>
        )}

        {view === 'recovery' && activePlan && (
          <motion.div
            key="recovery"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <Recovery 
              plan={activePlan} 
              onBack={() => setView('home')} 
            />
          </motion.div>
        )}

        {view === 'ambulance' && (
          <motion.div
            key="ambulance"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <AmbulanceTracker onBack={() => setView('home')} />
          </motion.div>
        )}

        {view === 'reinjury' && (
          <motion.div
            key="reinjury"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <ReinjuryScanner onBack={() => setView('home')} />
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
