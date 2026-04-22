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

/**
 * Returns the singleton Firebase Admin App instance.
 * Prevents re-initialization on hot module reloads during Next.js development.
 *
 * @returns {App} The initialized Firebase Admin application instance.
 * @throws {Error} If required environment variables are missing.
 */
function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
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

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    projectId,
  });
}

/** Singleton Admin App instance. */
const adminApp: App = getAdminApp();

/**
 * Firebase Admin Firestore instance.
 * Use this on the server side to bypass Security Rules with full admin access.
 */
export const adminDb: Firestore = getFirestore(adminApp);

/**
 * Firebase Admin Auth instance.
 * Use this to verify ID tokens from authenticated client requests.
 */
export const adminAuth: Auth = getAuth(adminApp);

/**
 * Firebase Admin Messaging instance.
 * Use this to send FCM push notifications from server-side API routes.
 */
export const adminMessaging: Messaging = getMessaging(adminApp);
