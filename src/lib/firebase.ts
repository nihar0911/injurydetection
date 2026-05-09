import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInAnonymously, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
const firebaseConfig = {
  apiKey: "AIzaSyDdYEncbK_pGEW-6MbxympL5KI1pGYhvdk",
  authDomain: "atheletai.firebaseapp.com",
  databaseURL: "https://atheletai-default-rtdb.firebaseio.com",
  projectId: "atheletai",
  storageBucket: "atheletai.firebasestorage.app",
  messagingSenderId: "1006851054201",
  appId: "1:1006851054201:web:588674a36129c3852052a8",
  measurementId: "G-06WP2YCLXP"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (error: any) {
    if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
      return null;
    }
    console.error("Google Auth Error:", error);
    throw error;
  }
};

export const signInAsGuest = async () => {
  try {
    return await signInAnonymously(auth);
  } catch (error) {
    console.error("Guest Auth Error:", error);
    throw error;
  }
};

export const signUpWithEmail = async (email: string, pass: string) => {
  return await createUserWithEmailAndPassword(auth, email, pass);
};

export const signInWithEmail = async (email: string, pass: string) => {
  return await signInWithEmailAndPassword(auth, email, pass);
};

// Connection test
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();
