/**
 * @file src/lib/analytics.ts
 * @description Google Analytics 4 (GA4) helper utilities for tracking
 *              user interactions with the election assistant.
 *              All events are sent to GA4 via the global gtag function
 *              injected by the Google Tag Manager snippet.
 */

/**
 * Represents a GA4 custom event payload.
 */
interface GA4EventParams {
  /** The event category (maps to GA4 event parameter). */
  category?: string;
  /** Human-readable label for the event. */
  label?: string;
  /** Numeric value associated with the event (e.g., message count). */
  value?: number;
  /** Any additional custom parameters. */
  [key: string]: string | number | boolean | undefined;
}

/**
 * Sends a custom event to Google Analytics 4 via the global gtag function.
 * Safe to call in any environment — no-ops if gtag is not present (SSR, tests).
 *
 * @param {string} eventName - The GA4 event name (snake_case recommended).
 * @param {GA4EventParams} [params={}] - Optional event parameters to attach.
 *
 * @example
 * trackEvent('chat_message_sent', { category: 'Chatbot', label: 'voter_registration' });
 */
export function trackEvent(eventName: string, params: GA4EventParams = {}): void {
  if (typeof window === 'undefined' || !('gtag' in window)) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).gtag('event', eventName, params);
}

/**
 * Tracks when a user sends a message to the Election Assistant chatbot.
 *
 * @param {string} messagePreview - A brief, non-PII excerpt of the user's message (max 100 chars).
 */
export function trackChatMessage(messagePreview: string): void {
  trackEvent('chat_message_sent', {
    category: 'Chatbot',
    label: messagePreview.slice(0, 100),
  });
}

/**
 * Tracks when a user views a specific election timeline phase.
 *
 * @param {string} phaseId - The ID of the election phase card that was viewed.
 */
export function trackTimelineView(phaseId: string): void {
  trackEvent('timeline_phase_viewed', {
    category: 'Timeline',
    label: phaseId,
  });
}

/**
 * Tracks when a user successfully locates a polling station on the map.
 *
 * @param {boolean} geolocationUsed - Whether the browser geolocation API was used.
 */
export function trackPollingStationSearch(geolocationUsed: boolean): void {
  trackEvent('polling_station_searched', {
    category: 'Map',
    label: geolocationUsed ? 'geolocation' : 'manual',
  });
}

/**
 * Tracks when a user signs in or signs up via Firebase Authentication.
 *
 * @param {'google' | 'anonymous'} method - The authentication method used.
 */
export function trackAuthEvent(method: 'google' | 'anonymous'): void {
  trackEvent('user_authenticated', {
    category: 'Auth',
    label: method,
  });
}
