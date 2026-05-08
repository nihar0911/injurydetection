import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Profile } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

interface AuthContextType {
  user: any; // Use any to allow mock user
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  enableDemoMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(() => sessionStorage.getItem('demo_mode') === 'true');

  const enableDemoMode = () => {
    sessionStorage.setItem('demo_mode', 'true');
    setIsDemo(true);
    setUser({ uid: 'demo_user', displayName: 'Pro Athlete' });
    setProfile({ 
      userId: 'demo_user', 
      displayName: 'Pro Athlete', 
      sports: ['Football', 'Running'],
      pastInjuries: 'None',
      createdAt: new Date(),
      tier: 'pro', 
      scansCount: 0 
    });
    setLoading(false);
  };

  const refreshProfile = async () => {
    if (isDemo) return;
    if (!auth.currentUser) {
      setProfile(null);
      return;
    }
    try {
      const docRef = doc(db, 'profiles', auth.currentUser.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProfile(docSnap.data() as Profile);
      } else {
        setProfile(null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `profiles/${auth.currentUser.uid}`);
    }
  };

  useEffect(() => {
    if (isDemo) {
      setUser({ uid: 'demo_user', displayName: 'Pro Athlete' });
      setProfile({ 
        userId: 'demo_user', 
        displayName: 'Pro Athlete', 
        sports: ['Football', 'Running'],
        pastInjuries: 'None',
        createdAt: new Date(),
        tier: 'pro', 
        scansCount: 0 
      });
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        await refreshProfile();
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [isDemo]);

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile, enableDemoMode }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
