import { Linter } from 'eslint';
import * as tsParser from '@typescript-eslint/parser';
import { eslintTypedReturnIsVoidLikeAdapter } from './eslint-typed-return-is-void-like-adapter';

// Real ESLint + real TypeScript program: this adapter only resolves anything once a full typed
// lint pass has built one, so it is exercised the same way eslintTypedFunctionTakesNoArgsAdapter
// is — against this package's own real file (no DOM lib) rather than a synthetic fixture. Built by
// slicing __dirname's own segments, not path.join, so the filename carries no unresolved `..` for
// `parserOptions.project: true` to walk from.
const DIR_SEGMENTS = __dirname.split('/');
// .../packages/eslint-plugin/src/adapters/eslint/typed-return-is-void-like — 3 up is src/
const REAL_FILE = `${DIR_SEGMENTS.slice(0, -3).join('/')}/index.ts`;

describe('eslintTypedReturnIsVoidLikeAdapter', () => {
  it('VALID: {declared void, no call} => returns [true]', () => {
    const found: ReturnType<typeof eslintTypedReturnIsVoidLikeAdapter>[] = [];
    const linter = new Linter({ configType: 'flat' });

    linter.verify(
      'const fn = (): void => {};',
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
                  ArrowFunctionExpression: (node: unknown): void => {
                    found.push(eslintTypedReturnIsVoidLikeAdapter({ context, node }));
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

  it('VALID: {declared Promise<{ success: true }>} => returns [true]', () => {
    const found: ReturnType<typeof eslintTypedReturnIsVoidLikeAdapter>[] = [];
    const linter = new Linter({ configType: 'flat' });

    linter.verify(
      'const fn = async (): Promise<{ success: true }> => ({ success: true });',
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
                  ArrowFunctionExpression: (node: unknown): void => {
                    found.push(eslintTypedReturnIsVoidLikeAdapter({ context, node }));
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

  it('INVALID: {declared boolean} => returns [false]', () => {
    const found: ReturnType<typeof eslintTypedReturnIsVoidLikeAdapter>[] = [];
    const linter = new Linter({ configType: 'flat' });

    linter.verify(
      'const fn = (): boolean => true;',
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
                  ArrowFunctionExpression: (node: unknown): void => {
                    found.push(eslintTypedReturnIsVoidLikeAdapter({ context, node }));
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

  it('INVALID: {declared Promise<string | undefined>} => returns [false]', () => {
    const found: ReturnType<typeof eslintTypedReturnIsVoidLikeAdapter>[] = [];
    const linter = new Linter({ configType: 'flat' });

    linter.verify(
      'const fn = async (): Promise<string | undefined> => undefined;',
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
                  ArrowFunctionExpression: (node: unknown): void => {
                    found.push(eslintTypedReturnIsVoidLikeAdapter({ context, node }));
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

  it('VALID: {call resolving to void} => returns [true, true]', () => {
    const found: ReturnType<typeof eslintTypedReturnIsVoidLikeAdapter>[] = [];
    const linter = new Linter({ configType: 'flat' });

    linter.verify(
      'const helper = (): void => {}; helper();',
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
                  ArrowFunctionExpression: (node: unknown): void => {
                    found.push(eslintTypedReturnIsVoidLikeAdapter({ context, node }));
                  },
                  CallExpression: (node: unknown): void => {
                    found.push(eslintTypedReturnIsVoidLikeAdapter({ context, node }));
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

    expect(found).toStrictEqual([true, true]);
  });

  it('INVALID: {call resolving to a real value} => returns [false, false]', () => {
    const found: ReturnType<typeof eslintTypedReturnIsVoidLikeAdapter>[] = [];
    const linter = new Linter({ configType: 'flat' });

    linter.verify(
      'const helper = (): boolean => true; helper();',
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
                  ArrowFunctionExpression: (node: unknown): void => {
                    found.push(eslintTypedReturnIsVoidLikeAdapter({ context, node }));
                  },
                  CallExpression: (node: unknown): void => {
                    found.push(eslintTypedReturnIsVoidLikeAdapter({ context, node }));
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

    expect(found).toStrictEqual([false, false]);
  });

  it('EMPTY: {non-callable value passed as a declaration node} => returns undefined', () => {
    const found: ReturnType<typeof eslintTypedReturnIsVoidLikeAdapter>[] = [];
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
                    found.push(eslintTypedReturnIsVoidLikeAdapter({ context, node: node.init }));
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
