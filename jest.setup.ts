/**
 * @file jest.setup.ts
 * @description Global setup file for Jest. Extends Jest's expect() with helpful
 *              DOM matchers from @testing-library/jest-dom (e.g., `toBeInTheDocument()`).
 */
import '@testing-library/jest-dom';

// Mock IntersectionObserver (not available in jsdom)
if (typeof window !== 'undefined') {
  class IntersectionObserverMock {
    observe = jest.fn();
    unobserve = jest.fn();
    disconnect = jest.fn();
  }
  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: IntersectionObserverMock,
  });
}

// Mock crypto.randomUUID for Node environments < 19
if (!global.crypto) {
  (global as any).crypto = {
    randomUUID: () => `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  };
}
