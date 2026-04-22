/**
 * @file src/app/api/history/route.ts
 * @description Secure Next.js API Routes for reading and writing a user's
 *              election assistant chat history to Firestore.
 *
 *              - GET  /api/history : Fetch the authenticated user's chat history.
 *              - POST /api/history : Store a new message pair in Firestore.
 *
 *              Both routes require a valid Firebase ID token in the Authorization header.
 * @route /api/history
 */

import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * Extracts and verifies the Firebase ID token from the Authorization header.
 *
 * @param {NextRequest} request - The incoming HTTP request.
 * @returns {Promise<string>} The verified user's UID.
 * @throws {Error} If the Authorization header is missing or the token is invalid.
 */
async function getVerifiedUid(request: NextRequest): Promise<string> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Missing or malformed Authorization header.');
  }
  const idToken = authHeader.slice(7);
  const decoded = await adminAuth.verifyIdToken(idToken);
  return decoded.uid;
}

/**
 * GET /api/history
 *
 * Returns the latest 50 chat messages for the authenticated user,
 * ordered by creation time (newest first).
 *
 * @param {NextRequest} request - Incoming HTTP request.
 * @returns {NextResponse} JSON array of chat message documents, or an error.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  let uid: string;
  try {
    uid = await getVerifiedUid(request);
  } catch {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const snapshot = await adminDb
      .collection('chatHistory')
      .doc(uid)
      .collection('messages')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const messages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: (doc.data().createdAt as Timestamp)?.toDate().toISOString(),
    }));

    return NextResponse.json({ messages }, { status: 200 });
  } catch (error) {
    console.error('[/api/history GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat history.' },
      { status: 500 }
    );
  }
}

/**
 * Shape of a single message pair to store.
 */
interface MessagePair {
  /** The user's original message. */
  userMessage: string;
  /** The assistant's response. */
  assistantReply: string;
}

/**
 * POST /api/history
 *
 * Saves a user message/assistant reply pair to the authenticated user's
 * Firestore chat history subcollection.
 *
 * @param {NextRequest} request - Incoming HTTP request with JSON body.
 * @returns {NextResponse} Success with the new document ID, or an error.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  let uid: string;
  try {
    uid = await getVerifiedUid(request);
  } catch {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  let body: MessagePair;
  try {
    body = await request.json() as MessagePair;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { userMessage, assistantReply } = body;
  if (!userMessage || !assistantReply) {
    return NextResponse.json(
      { error: 'Both "userMessage" and "assistantReply" are required.' },
      { status: 400 }
    );
  }

  try {
    const docRef = await adminDb
      .collection('chatHistory')
      .doc(uid)
      .collection('messages')
      .add({
        userMessage,
        assistantReply,
        createdAt: Timestamp.now(),
      });

    return NextResponse.json({ success: true, id: docRef.id }, { status: 201 });
  } catch (error) {
    console.error('[/api/history POST]', error);
    return NextResponse.json(
      { error: 'Failed to save chat history.' },
      { status: 500 }
    );
  }
}
