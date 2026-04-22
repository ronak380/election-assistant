/**
 * @file src/__tests__/analytics.test.ts
 * @description Unit tests for the GA4 analytics helper functions.
 *              Uses Jest mocks to verify gtag is called with the correct event names
 *              and parameters without requiring a real browser or GA4 connection.
 */

import {
  trackEvent,
  trackChatMessage,
  trackTimelineView,
  trackPollingStationSearch,
  trackAuthEvent,
} from '@/lib/analytics';

/** Mock gtag function attached to window for test environment. */
const mockGtag = jest.fn();

beforeEach(() => {
  // Reset call history between tests
  mockGtag.mockClear();
  // Attach mock gtag to window
  Object.defineProperty(window, 'gtag', {
    value: mockGtag,
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  // Clean up window.gtag
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (window as any).gtag;
});

// ============================================================================
// trackEvent (base function)
// ============================================================================
describe('trackEvent', () => {
  it('calls window.gtag with the correct event name and params', () => {
    trackEvent('test_event', { category: 'Test', label: 'unit-test', value: 42 });
    expect(mockGtag).toHaveBeenCalledTimes(1);
    expect(mockGtag).toHaveBeenCalledWith('event', 'test_event', {
      category: 'Test',
      label: 'unit-test',
      value: 42,
    });
  });

  it('calls gtag with empty params object when no params supplied', () => {
    trackEvent('empty_event');
    expect(mockGtag).toHaveBeenCalledWith('event', 'empty_event', {});
  });

  it('does NOT throw when window.gtag is not defined', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).gtag;
    expect(() => trackEvent('safe_event')).not.toThrow();
  });

  it('does NOT call gtag when gtag is not present on window', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).gtag;
    trackEvent('no_gtag_event');
    expect(mockGtag).not.toHaveBeenCalled();
  });
});

// ============================================================================
// trackChatMessage
// ============================================================================
describe('trackChatMessage', () => {
  it('calls gtag with chat_message_sent event', () => {
    trackChatMessage('How do I register to vote?');
    expect(mockGtag).toHaveBeenCalledWith('event', 'chat_message_sent', {
      category: 'Chatbot',
      label: 'How do I register to vote?',
    });
  });

  it('truncates message preview to 100 characters', () => {
    const longMessage = 'A'.repeat(150);
    trackChatMessage(longMessage);
    const callArgs = mockGtag.mock.calls[0][2];
    expect(callArgs.label.length).toBe(100);
  });

  it('uses the full message when under 100 characters', () => {
    const shortMessage = 'Short question?';
    trackChatMessage(shortMessage);
    const callArgs = mockGtag.mock.calls[0][2];
    expect(callArgs.label).toBe(shortMessage);
  });
});

// ============================================================================
// trackTimelineView
// ============================================================================
describe('trackTimelineView', () => {
  it('calls gtag with timeline_phase_viewed event and the phase ID', () => {
    trackTimelineView('voter-registration');
    expect(mockGtag).toHaveBeenCalledWith('event', 'timeline_phase_viewed', {
      category: 'Timeline',
      label: 'voter-registration',
    });
  });
});

// ============================================================================
// trackPollingStationSearch
// ============================================================================
describe('trackPollingStationSearch', () => {
  it('calls gtag with geolocation label when geolocation was used', () => {
    trackPollingStationSearch(true);
    expect(mockGtag).toHaveBeenCalledWith('event', 'polling_station_searched', {
      category: 'Map',
      label: 'geolocation',
    });
  });

  it('calls gtag with manual label when geolocation was NOT used', () => {
    trackPollingStationSearch(false);
    expect(mockGtag).toHaveBeenCalledWith('event', 'polling_station_searched', {
      category: 'Map',
      label: 'manual',
    });
  });
});

// ============================================================================
// trackAuthEvent
// ============================================================================
describe('trackAuthEvent', () => {
  it('calls gtag with user_authenticated and google method', () => {
    trackAuthEvent('google');
    expect(mockGtag).toHaveBeenCalledWith('event', 'user_authenticated', {
      category: 'Auth',
      label: 'google',
    });
  });

  it('calls gtag with user_authenticated and anonymous method', () => {
    trackAuthEvent('anonymous');
    expect(mockGtag).toHaveBeenCalledWith('event', 'user_authenticated', {
      category: 'Auth',
      label: 'anonymous',
    });
  });
});
