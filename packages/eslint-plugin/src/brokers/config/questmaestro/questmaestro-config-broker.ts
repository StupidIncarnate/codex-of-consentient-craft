import type { EslintConfig } from '../../../contracts/eslint-config/eslint-config-contract';

export const questmaestroConfigBroker = (): EslintConfig => ({
  plugins: {},
  rules: {
    '@questmaestro/ban-primitives': 'error',
    '@questmaestro/require-zod-on-primitives': 'error',
    '@questmaestro/explicit-return-types': 'error',
    '@questmaestro/enforce-folder-structure': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-function-return-type': [
      'error',
      {
        allowExpressions: false,
        allowTypedFunctionExpressions: false,
        allowHigherOrderFunctions: false,
      },
    ],
    '@typescript-eslint/ban-types': [
      'error',
      {
        types: {
          string: 'Use Zod contract types like EmailAddress, UserName, FilePath, etc.',
          number: 'Use Zod contract types like Currency, PositiveNumber, Age, etc.',
          String: 'Use Zod contract types instead of String constructor',
          Number: 'Use Zod contract types instead of Number constructor',
        },
        extendDefaults: true,
      },
    ],
    'no-restricted-syntax': [
      'error',
      {
        selector:
          'CallExpression[callee.object.name="z"][callee.property.name="string"]:not(:has(MemberExpression[property.name="brand"]))',
        message:
          "z.string() must be chained with .brand() - use z.string().email().brand<'EmailAddress'>() instead of z.string().email()",
      },
      {
        selector:
          'CallExpression[callee.object.name="z"][callee.property.name="number"]:not(:has(MemberExpression[property.name="brand"]))',
        message:
          "z.number() must be chained with .brand() - use z.number().positive().brand<'PositiveNumber'>() instead of z.number().positive()",
      },
    ],
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/prefer-const': 'error',
    '@typescript-eslint/no-var-requires': 'error',
  },
});
