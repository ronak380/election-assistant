/**
 * @file babel.config.js
 * @description Conditional Babel configuration.
 *
 *              - TEST environment (Jest): custom presets for TypeScript/React
 *              - PRODUCTION/DEVELOPMENT (Next.js build): next/babel preset which
 *                supports Next.js 15 import attribute syntax natively
 *
 *              Note: api.env() sets up environment-based caching automatically.
 *              Do NOT call api.cache() before api.env() — they conflict.
 *              This file shadows babel.config.json (JS takes precedence over JSON).
 */

module.exports = function (api) {
  // api.env() automatically sets up cache invalidation based on NODE_ENV
  const isTest = api.env('test');

  if (isTest) {
    return {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        ['@babel/preset-react', { runtime: 'automatic' }],
        '@babel/preset-typescript',
      ],
    };
  }

  // For Next.js build — next/babel supports import attributes + all Next.js 15 features
  return {
    presets: ['next/babel'],
  };
};
