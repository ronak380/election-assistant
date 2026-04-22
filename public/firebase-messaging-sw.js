/**
 * @file public/firebase-messaging-sw.js
 * @description Firebase Cloud Messaging Service Worker.
 *
 *              This service worker handles background push notifications from FCM.
 *              It must be served from the root of the domain (public/ directory)
 *              to have the correct scope for intercepting push events.
 *
 *              The Firebase SDK version here must match the version in package.json.
 *
 * @see https://firebase.google.com/docs/cloud-messaging/js/receive
 */

// Import Firebase scripts for service worker environment (non-module context)
importScripts('https://www.gstatic.com/firebasejs/12.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.0.0/firebase-messaging-compat.js');

/**
 * Firebase configuration.
 * These values are safe to include in the service worker as they are restricted
 * by Firebase Security Rules and API key restrictions in GCP Console.
 *
 * NOTE: Replace these placeholder values with your actual Firebase config.
 * In production, these are baked in during the build via environment variables.
 */
firebase.initializeApp({
  apiKey: self.__FIREBASE_API_KEY__ || 'your-api-key',
  authDomain: self.__FIREBASE_AUTH_DOMAIN__ || 'your-project.firebaseapp.com',
  projectId: self.__FIREBASE_PROJECT_ID__ || 'your-project-id',
  storageBucket: self.__FIREBASE_STORAGE_BUCKET__ || 'your-project.appspot.com',
  messagingSenderId: self.__FIREBASE_SENDER_ID__ || 'your-sender-id',
  appId: self.__FIREBASE_APP_ID__ || 'your-app-id',
});

/** Get the Firebase Messaging instance for this service worker. */
const messaging = firebase.messaging();

/**
 * Handles background push notifications (when the app is not in the foreground).
 * Displays a notification with the title, body, and icon from the FCM payload.
 *
 * @param {object} payload - The FCM message payload received from the server.
 */
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw] Background message received:', payload);

  const notificationTitle = payload.notification?.title ?? 'ElectionGuide';
  const notificationOptions = {
    body: payload.notification?.body ?? 'You have a new election reminder.',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'election-notification',
    renotify: true,
    data: {
      url: payload.fcmOptions?.link ?? '/',
    },
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

/**
 * Handle notification click events — open the app URL from the notification data.
 *
 * @param {NotificationEvent} event - The notification click event.
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url ?? '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If the app is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
