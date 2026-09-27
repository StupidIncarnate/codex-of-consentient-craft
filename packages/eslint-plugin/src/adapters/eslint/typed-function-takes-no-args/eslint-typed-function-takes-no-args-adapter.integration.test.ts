import { Linter } from 'eslint';
import * as tsParser from '@typescript-eslint/parser';
import { eslintTypedFunctionTakesNoArgsAdapter } from './eslint-typed-function-takes-no-args-adapter';

// Real ESLint + real TypeScript program: this adapter only resolves anything once a full typed
// lint pass has built one, so it is exercised the same way eslintTypedParserServicesAdapter is —
// against this package's own real file (no DOM lib) rather than a synthetic fixture. Built by
// slicing `__dirname`'s own segments, not `path.join`, so the filename carries no unresolved `..`
// for `parserOptions.project: true` to walk from.
const DIR_SEGMENTS = __dirname.split('/');
// .../packages/eslint-plugin/src/adapters/eslint/typed-function-takes-no-args — 3 up is src/
const REAL_FILE = `${DIR_SEGMENTS.slice(0, -3).join('/')}/index.ts`;

describe('eslintTypedFunctionTakesNoArgsAdapter', () => {
  it('VALID: {identifier typed with an optional-only parameter} => returns true', () => {
    const found: ReturnType<typeof eslintTypedFunctionTakesNoArgsAdapter>[] = [];
    const linter = new Linter({ configType: 'flat' });

    linter.verify(
      "import { randomUUID } from 'crypto';\nconst probed = randomUUID;",
      {
        files: ['**/*.ts'],
        languageOptions: {
          parser: tsParser,
          parserOptions: { ecmaVersion: 2020, sourceType: 'module', project: true },
        },
        plugins: {
          probe: {
            rules: {
              x: {
                create: (context: unknown) => ({
                  VariableDeclarator: (node: { init: unknown }): void => {
                    found.push(eslintTypedFunctionTakesNoArgsAdapter({ context, node: node.init }));
                  },
                }),
              },
            },
          },
        },
        rules: { 'probe/x': 'error' },
      },
      { filename: REAL_FILE },
    );

    expect(found).toStrictEqual([true]);
  });

  it('INVALID: {identifier typed with a required first parameter} => returns false', () => {
    const found: ReturnType<typeof eslintTypedFunctionTakesNoArgsAdapter>[] = [];
    const linter = new Linter({ configType: 'flat' });

    linter.verify(
      "import { readFileSync } from 'fs';\nconst probed = readFileSync;",
      {
        files: ['**/*.ts'],
        languageOptions: {
          parser: tsParser,
          parserOptions: { ecmaVersion: 2020, sourceType: 'module', project: true },
        },
        plugins: {
          probe: {
            rules: {
              x: {
                create: (context: unknown) => ({
                  VariableDeclarator: (node: { init: unknown }): void => {
                    found.push(eslintTypedFunctionTakesNoArgsAdapter({ context, node: node.init }));
                  },
                }),
              },
            },
          },
        },
        rules: { 'probe/x': 'error' },
      },
      { filename: REAL_FILE },
    );

    expect(found).toStrictEqual([false]);
  });

  it('EMPTY: {non-callable value} => returns undefined', () => {
    const found: ReturnType<typeof eslintTypedFunctionTakesNoArgsAdapter>[] = [];
    const linter = new Linter({ configType: 'flat' });

    linter.verify(
      'const probed = 1;',
      {
        files: ['**/*.ts'],
        languageOptions: {
          parser: tsParser,
          parserOptions: { ecmaVersion: 2020, sourceType: 'module', project: true },
        },
        plugins: {
          probe: {
            rules: {
              x: {
                create: (context: unknown) => ({
                  VariableDeclarator: (node: { init: unknown }): void => {
                    found.push(eslintTypedFunctionTakesNoArgsAdapter({ context, node: node.init }));
                  },
                }),
              },
            },
          },
        },
        rules: { 'probe/x': 'error' },
      },
      { filename: REAL_FILE },
    );

    expect(found).toStrictEqual([undefined]);
  });
});
