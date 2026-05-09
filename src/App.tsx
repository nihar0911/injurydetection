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
import UpgradeModal from './components/UpgradeModal';
import { BodyPart, RecoveryPlan } from './types';
import { motion, AnimatePresence } from 'motion/react';

const AppContent = () => {
  const { user, profile, loading } = useAuth();
  const [view, setView] = useState<'home' | 'triage' | 'recovery' | 'ambulance' | 'reinjury'>('home');
  const [selectedPart, setSelectedPart] = useState<BodyPart | null>(null);
  const [activePlan, setActivePlan] = useState<RecoveryPlan | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

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
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <Home 
              onStartTriage={(part) => {
                setSelectedPart(part);
                setView('triage');
              }} 
              onViewRecovery={(plan) => {
                if (profile?.tier === 'pro') {
                  setActivePlan(plan);
                  setView('recovery');
                } else {
                  setShowUpgradeModal(true);
                }
              }}
              onStartReinjuryScanner={() => setView('reinjury')}
            />
            <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
          </motion.div>
        )}

        {view === 'triage' && selectedPart && (
          <motion.div
            key="triage"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.3 }}
          >
            <Triage 
              selectedPart={selectedPart} 
              onBack={() => setView('home')} 
              onPlanGenerated={(plan) => {
                if (profile?.tier === 'pro') {
                  setActivePlan(plan);
                  setView('recovery');
                } else {
                  // For free users, they stay on Home but can see the notification for the triage result
                  // But we don't let them open the planner.
                  setView('home');
                }
              }}
              onCallAmbulance={() => setView('ambulance')}
            />
          </motion.div>
        )}

        {view === 'recovery' && activePlan && (
          <motion.div
            key="recovery"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.3 }}
          >
            <AmbulanceTracker onBack={() => setView('home')} />
          </motion.div>
        )}

        {view === 'reinjury' && (
          <motion.div
            key="reinjury"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.3 }}
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
