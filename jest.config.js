/** @type {import('jest').Config} */
const config = {
  // Use jsdom for browser-like environment in React component tests
  testEnvironment: 'jsdom',

  // Runs after the test environment is set up and jest globals (expect) are available.
  // Required for @testing-library/jest-dom to extend expect() with DOM matchers.
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

  // Transform TypeScript and TSX using babel-jest (reads babel.config.json)
  transform: {
    '^.+\\.(t|j)sx?$': 'babel-jest',
  },

  // Clear mocks between each test
  clearMocks: true,

  // Map module path aliases to match tsconfig paths (@/ → src/)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // Mock CSS and static asset imports so Jest doesn't fail on them
    '\\.(css|less|scss|sass)$': '<rootDir>/__mocks__/styleMock.js',
    '\\.(jpg|jpeg|png|gif|svg|webp|ico)$': '<rootDir>/__mocks__/fileMock.js',
  },

  // Collect coverage from all source TypeScript files
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/app/layout.tsx',
    '!src/app/**/page.tsx',
  ],

  // Which files to treat as tests
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{ts,tsx}',
    '<rootDir>/src/**/*.{spec,test}.{ts,tsx}',
  ],

  // Exclude node_modules and build output from tests
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/'],

  // Module file resolution order
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // Ensure ESM-only modules are transformed by babel-jest
  transformIgnorePatterns: [
    '/node_modules/(?!(react-markdown|@google/generative-ai|vfile|vfile-message|unist-util-stringify-position|unified|bail|is-plain-obj|trough|remark-parse|remark-rehype|rehype-stringify|decode-named-character-reference|character-entities|markdown-table|property-information|hast-util-whitespace|space-separated-tokens|comma-separated-tokens|hast-util-to-html|hast-util-sanitize|hast-util-from-parse5|parse5|hast-util-parse-selector|hast-util-has-property|hast-util-is-element|hastscript|web-namespaces|hast-util-to-jsx-runtime)/)',
  ],

  // Increase timeout for async AI/Map mocks
  testTimeout: 10000,
};

module.exports = config;
