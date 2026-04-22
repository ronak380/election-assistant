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
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

if (!config.apiKey) {
  console.error('[Firebase] Missing NEXT_PUBLIC_FIREBASE_API_KEY');
}

if (!config.authDomain || !config.authDomain.includes('.')) {
  console.warn('[Firebase] Warning: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN looks incomplete:', config.authDomain);
}

/** Cached Firebase App instance. */
let _app: FirebaseApp | null = null;

/**
 * Returns the singleton Firebase App instance.
 * Lazy-initialized to avoid build-time errors when env vars are missing.
 * Ensures initialization only happens on the client side.
 *
 * @returns {FirebaseApp | null} The initialized Firebase application instance, or null if on server.
 */
function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === 'undefined') return null;
  if (_app) return _app;
  try {
    if (!config.apiKey || !config.authDomain) {
      console.error('[Firebase] Initialization failed: Missing API Key or Auth Domain.');
      return null;
    }
    return (_app = initializeApp(config));
  } catch (error) {
    console.error('[firebase] Failed to initialize Firebase App:', error);
    return null;
  }
}

/**
 * Firebase Authentication instance (lazy).
 * Returns null if called on the server.
 */
export function getFirebaseAuth(): Auth | null {
  const app = getFirebaseApp();
  return app ? getAuth(app) : null;
}

/**
 * Firestore database instance (lazy).
 * Returns null if called on the server.
 */
export function getFirebaseDb(): Firestore | null {
  const app = getFirebaseApp();
  return app ? getFirestore(app) : null;
}

/**
 * Factory function to lazily retrieve the Firebase Messaging instance.
 * Returns null in environments where FCM is not supported (e.g., SSR, Safari).
 *
 * @returns {Promise<Messaging | null>} The Messaging instance or null if unsupported/server.
 */
export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (typeof window === 'undefined') return null;
  const app = getFirebaseApp();
  if (!app) return null;
  const supported = await isSupported();
  if (!supported) return null;
  return getMessaging(app);
}

export { getFirebaseApp as getApp };
