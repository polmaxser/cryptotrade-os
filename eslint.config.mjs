import baseConfig from '@cryptotrade/eslint-config/base';

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...baseConfig,
  {
    // NestJS resolves constructor/DTO injection via emitDecoratorMetadata at runtime.
    // `import type` erases the value, silently breaking DI — this rule can't tell the difference.
    // Scoped here (not just apps/api/eslint.config.mjs) because lint-staged/husky invoke
    // eslint from the repo root, where flat config resolution ignores nested config files.
    files: ['apps/api/**/*.ts'],
    rules: {
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },
];
