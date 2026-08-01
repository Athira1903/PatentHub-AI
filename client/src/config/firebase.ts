import { signInWithPopup } from 'firebase/auth';
import app, { auth, googleProvider } from '../firebase';

export { app, auth, googleProvider };

export interface FirebaseAuthResult {
  email: string;
  displayName: string;
  photoURL?: string;
  uid: string;
}

/**
 * Perform 100% Real Firebase Google OAuth Popup Authentication
 * (Strictly uses real Firebase SDK without fake prompts or mock fallbacks)
 */
export const signInWithGoogleFirebase = async (): Promise<FirebaseAuthResult> => {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  if (!user || !user.email) {
    throw new Error('No email associated with this Google Account');
  }
  return {
    email: user.email,
    displayName: user.displayName || user.email.split('@')[0],
    photoURL: user.photoURL || undefined,
    uid: user.uid,
  };
};
