import { Linter } from '#gateway/npm/eslint';
import * as tsParser from '#gateway/npm/typescript-eslint__parser';
import { typedFunctionTakesNoArgsTransformer } from './typed-function-takes-no-args-transformer';

// Real ESLint + real TypeScript program: this transformer only resolves anything once a full typed
// lint pass has built one, so it is exercised the same way typedParserServicesTransformer is —
// against this package's own real file (no DOM lib) rather than a synthetic fixture. Built by
// slicing `__dirname`'s own segments, not `path.join`, so the filename carries no unresolved `..`
// for `parserOptions.project: true` to walk from.
const DIR_SEGMENTS = __dirname.split('/');
// .../packages/eslint-plugin/src/transformers/typed-function-takes-no-args — 2 up is src/
const REAL_FILE = `${DIR_SEGMENTS.slice(0, -2).join('/')}/index.ts`;

describe('typedFunctionTakesNoArgsTransformer', () => {
  it('VALID: {identifier typed with an optional-only parameter} => returns true', () => {
    const found: ReturnType<typeof typedFunctionTakesNoArgsTransformer>[] = [];
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
                    found.push(typedFunctionTakesNoArgsTransformer({ context, node: node.init }));
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
    const found: ReturnType<typeof typedFunctionTakesNoArgsTransformer>[] = [];
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
                    found.push(typedFunctionTakesNoArgsTransformer({ context, node: node.init }));
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
    const found: ReturnType<typeof typedFunctionTakesNoArgsTransformer>[] = [];
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
                    found.push(typedFunctionTakesNoArgsTransformer({ context, node: node.init }));
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
