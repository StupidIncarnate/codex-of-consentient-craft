import { Linter } from 'eslint';
import * as tsParser from '@typescript-eslint/parser';
import { eslintTypedParserServicesAdapter } from './eslint-typed-parser-services-adapter';

// Real ESLint + real TypeScript program: parserServices only exist once a full typed lint pass has
// built one, so this exercises the adapter the same way platform-globals-ban does, against this
// package's own real file (no DOM lib) rather than re-deriving a synthetic fixture. Built by
// slicing `__dirname`'s own segments, not `path.join`, so the filename carries no unresolved `..`
// for `parserOptions.project: true` to walk from.
const DIR_SEGMENTS = __dirname.split('/');
// .../packages/eslint-plugin/src/adapters/eslint/typed-parser-services — 6 up is the repo root
const REPO_ROOT = DIR_SEGMENTS.slice(0, -6).join('/');
const REAL_FILE = `${DIR_SEGMENTS.slice(0, -3).join('/')}/index.ts`;

describe('eslintTypedParserServicesAdapter', () => {
  it('VALID: {identifier resolving to @types/node} => returns the @types/node declaration file', () => {
    const found: ReturnType<typeof eslintTypedParserServicesAdapter>[] = [];
    const linter = new Linter({ configType: 'flat' });

    linter.verify(
      "process.env['X'];",
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
                  Identifier: (node: unknown): void => {
                    found.push(eslintTypedParserServicesAdapter({ context, node }));
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

    expect(found[0]).toBe(`${REPO_ROOT}/node_modules/@types/node/globals.d.ts`);
  });

  it('VALID: {identifier resolving to lib.es5} => returns the lib.es5 declaration file', () => {
    const found: ReturnType<typeof eslintTypedParserServicesAdapter>[] = [];
    const linter = new Linter({ configType: 'flat' });

    linter.verify(
      'JSON;',
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
                  Identifier: (node: unknown): void => {
                    found.push(eslintTypedParserServicesAdapter({ context, node }));
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

    expect(found[0]).toBe(`${REPO_ROOT}/node_modules/typescript/lib/lib.es5.d.ts`);
  });

  it('EMPTY: {locally declared identifier} => returns this same test file, not a lib file', () => {
    const found: ReturnType<typeof eslintTypedParserServicesAdapter>[] = [];
    const linter = new Linter({ configType: 'flat' });

    linter.verify(
      'const localOnly = 1; localOnly;',
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
                  Identifier: (node: unknown): void => {
                    found.push(eslintTypedParserServicesAdapter({ context, node }));
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

    expect(found.every((fileName) => fileName === REAL_FILE)).toBe(true);
  });
});
