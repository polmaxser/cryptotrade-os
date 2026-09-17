// next/jest ships CJS-only and Jest loads this config file itself via
// require() regardless of the rest of the project's ESM conventions —
// this is the pattern Next.js's own docs use.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const nextJest = require('next/jest');

// next/jest reads next.config.js/.babelrc and handles the SWC transform,
// CSS/image mocking, and env loading automatically — hand-rolling a
// ts-jest config here would mean re-deriving all of that ourselves.
const createJestConfig = nextJest({ dir: './' });

/** @type {import('jest').Config} */
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  modulePathIgnorePatterns: ['<rootDir>/.next/'],
};

module.exports = createJestConfig(customJestConfig);
