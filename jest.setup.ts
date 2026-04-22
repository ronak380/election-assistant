/**
 * @file jest.setup.ts
 * @description Global setup file for Jest. Extends Jest's expect() with helpful
 *              DOM matchers from @testing-library/jest-dom (e.g., `toBeInTheDocument()`).
 */
import '@testing-library/jest-dom';
