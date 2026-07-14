import baseConfig from '@cryptotrade/eslint-config/nest';

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...baseConfig,
  {
    rules: {
      // NestJS resolves constructor/DTO injection via emitDecoratorMetadata at runtime.
      // `import type` erases the value, silently breaking DI — this rule can't tell the difference.
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },
];
