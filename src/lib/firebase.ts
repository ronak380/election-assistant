/**
 * @file src/lib/firebase.ts
 * @description Initializes the Firebase Client SDK as a singleton.
 *              Exports Auth, Firestore, and FCM instances for use in client components.
 *              All keys used here are NEXT_PUBLIC_ prefixed and safe for the browser;
 *              they are protected by Firebase Security Rules, NOT secrecy.
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getMessaging, type Messaging, isSupported } from 'firebase/messaging';

/** Firebase client configuration pulled from environment variables. */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

/** Cached Firebase App instance. */
let _app: FirebaseApp | null = null;

/**
 * Returns the singleton Firebase App instance.
 * Lazy-initialized to avoid build-time errors when env vars are missing.
 *
 * @returns {FirebaseApp} The initialized Firebase application instance.
 */
function getFirebaseApp(): FirebaseApp {
  if (_app) return _app;
  if (getApps().length > 0) {
    _app = getApp();
    return _app;
  }
  return (_app = initializeApp(firebaseConfig));
}

/**
 * Firebase Authentication instance (lazy).
 * Supports Google Sign-In, Email/Password, and Anonymous auth.
 */
export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp());
}

/**
 * Firestore database instance (lazy).
 * Use this for reading/writing election data from the browser.
 */
export function getFirebaseDb(): Firestore {
  return getFirestore(getFirebaseApp());
}

/**
 * Factory function to lazily retrieve the Firebase Messaging instance.
 * Returns null in environments where FCM is not supported (e.g., SSR, Safari).
 *
 * @returns {Promise<Messaging | null>} The Messaging instance or null if unsupported.
 */
export async function getFirebaseMessaging(): Promise<Messaging | null> {
  const supported = await isSupported();
  if (!supported) return null;
  return getMessaging(getFirebaseApp());
}

export { getFirebaseApp as getApp };
