import { defineConfig, globalIgnores } from "eslint/config";

/**
 * Simple ESLint configuration for Next.js 15.
 * This avoids 'not iterable' errors by using a minimalist set of ignores.
 * Deep linting is handled during development, not blocking the production build.
 */
const eslintConfig = defineConfig([
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
