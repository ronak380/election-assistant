/**
 * @file src/lib/firebase-admin.ts
 * @description Initializes the Firebase Admin SDK as a singleton for use ONLY
 *              in Next.js API routes (server-side). This module must NEVER be
 *              imported in client components — doing so would expose the private key.
 *
 *              Uses environment variables for credentials to avoid committing
 *              the service account JSON to source control.
 */

import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getMessaging, type Messaging } from 'firebase-admin/messaging';

/** Cached Admin App instance — null until first use. */
let _adminApp: App | null = null;

/**
 * Returns the singleton Firebase Admin App instance.
 * Lazy-initialized on first call so it doesn't run at build time.
 *
 * @returns {App} The initialized Firebase Admin application instance.
 * @throws {Error} If required environment variables are missing.
 */
function getAdminApp(): App {
  if (_adminApp) return _adminApp;
  if (getApps().length > 0) {
    _adminApp = getApps()[0];
    return _adminApp;
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      '[firebase-admin] Missing required environment variables: ' +
      'FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, or FIREBASE_ADMIN_PRIVATE_KEY'
    );
  }

  _adminApp = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    projectId,
  });
  return _adminApp;
}

/**
 * Firebase Admin Firestore instance (lazy).
 * Use this on the server side to bypass Security Rules with full admin access.
 */
export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}

/**
 * Firebase Admin Auth instance (lazy).
 * Use this to verify ID tokens from authenticated client requests.
 */
export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}

/**
 * Firebase Admin Messaging instance (lazy).
 * Use this to send FCM push notifications from server-side API routes.
 */
export function getAdminMessaging(): Messaging {
  return getMessaging(getAdminApp());
}
