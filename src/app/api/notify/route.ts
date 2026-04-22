/**
 * @file src/app/api/notify/route.ts
 * @description Secure Next.js API Route for sending election reminder push
 *              notifications via Firebase Cloud Messaging (FCM) Admin SDK.
 *
 *              Requires a valid Firebase Admin token (authenticated requests only).
 *              Used to notify users about upcoming election deadlines.
 *
 * @method POST
 * @route /api/notify
 */

import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth, adminMessaging } from '@/lib/firebase-admin';

/**
 * Expected request body for the notification endpoint.
 */
interface NotifyRequestBody {
  /** Firebase Authentication ID token to verify the requesting user. Required. */
  idToken: string;
  /** FCM device registration token for the target device. Required. */
  fcmToken: string;
  /** Notification title text. Required. */
  title: string;
  /** Notification body text. Required. */
  body: string;
}

/**
 * POST /api/notify
 *
 * Verifies the caller's Firebase ID token, then sends a push notification
 * to the specified FCM device token using the Firebase Admin Messaging SDK.
 *
 * @param {NextRequest} request - Incoming HTTP request with JSON body.
 * @returns {NextResponse} Success message with FCM message ID, or an error.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: NotifyRequestBody;

  try {
    body = await request.json() as NotifyRequestBody;
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body. Expected JSON.' },
      { status: 400 }
    );
  }

  const { idToken, fcmToken, title, body: notifBody } = body;

  // --- Validate required fields ---
  if (!idToken || !fcmToken || !title || !notifBody) {
    return NextResponse.json(
      { error: 'Missing required fields: idToken, fcmToken, title, body.' },
      { status: 400 }
    );
  }

  // --- Verify Firebase ID Token ---
  try {
    await adminAuth.verifyIdToken(idToken);
  } catch {
    return NextResponse.json(
      { error: 'Unauthorized. Invalid or expired Firebase ID token.' },
      { status: 401 }
    );
  }

  // --- Send FCM Notification via Admin SDK ---
  try {
    const messageId = await adminMessaging.send({
      token: fcmToken,
      notification: { title, body: notifBody },
      webpush: {
        notification: {
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          requireInteraction: true,
        },
        fcmOptions: { link: '/' },
      },
    });

    return NextResponse.json({ success: true, messageId }, { status: 200 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown FCM error';
    console.error('[/api/notify] FCM send error:', msg);
    return NextResponse.json(
      { error: 'Failed to send notification. Please try again.' },
      { status: 500 }
    );
  }
}
