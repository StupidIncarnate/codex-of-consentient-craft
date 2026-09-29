import { Linter } from '#gateway/npm/eslint';
import * as tsParser from '#gateway/npm/typescript-eslint__parser';
import { typedParserServicesTransformer } from './typed-parser-services-transformer';

// Real ESLint + real TypeScript program: parserServices only exist once a typed lint pass has built
// one. Each case parses against a one-file fixture tsconfig (no DOM lib) instead of the package's own
// program, which holds every source file of the package while the transformer only asks the checker
// where one identifier is declared. `REAL_FILE` is that fixture's only file. Built by slicing
// `__dirname`'s own segments, not `path.join`, so the filename carries no unresolved `..`.
const DIR_SEGMENTS = __dirname.split('/');
// .../packages/eslint-plugin/src/transformers/typed-parser-services — 5 up is the repo root
const REPO_ROOT = DIR_SEGMENTS.slice(0, -5).join('/');
const PACKAGE_ROOT = DIR_SEGMENTS.slice(0, -3).join('/');
const FIXTURE_TSCONFIG = `${PACKAGE_ROOT}/test/fixtures/typed-transformers/tsconfig.node.json`;
const REAL_FILE = `${PACKAGE_ROOT}/src/statics/regex-match-methods/regex-match-methods-statics.ts`;

describe('typedParserServicesTransformer', () => {
  it('VALID: {identifier resolving to @types/node} => returns the @types/node declaration file', () => {
    const found: ReturnType<typeof typedParserServicesTransformer>[] = [];
    const linter = new Linter({ configType: 'flat' });

    linter.verify(
      "process.env['X'];",
      {
        files: ['**/*.ts'],
        languageOptions: {
          parser: tsParser,
          parserOptions: { ecmaVersion: 2020, sourceType: 'module', project: FIXTURE_TSCONFIG },
        },
        plugins: {
          probe: {
            rules: {
              x: {
                create: (context: unknown) => ({
                  Identifier: (node: unknown): void => {
                    found.push(typedParserServicesTransformer({ context, node }));
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
    const found: ReturnType<typeof typedParserServicesTransformer>[] = [];
    const linter = new Linter({ configType: 'flat' });

    linter.verify(
      'JSON;',
      {
        files: ['**/*.ts'],
        languageOptions: {
          parser: tsParser,
          parserOptions: { ecmaVersion: 2020, sourceType: 'module', project: FIXTURE_TSCONFIG },
        },
        plugins: {
          probe: {
            rules: {
              x: {
                create: (context: unknown) => ({
                  Identifier: (node: unknown): void => {
                    found.push(typedParserServicesTransformer({ context, node }));
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
    const found: ReturnType<typeof typedParserServicesTransformer>[] = [];
    const linter = new Linter({ configType: 'flat' });

    linter.verify(
      'const localOnly = 1; localOnly;',
      {
        files: ['**/*.ts'],
        languageOptions: {
          parser: tsParser,
          parserOptions: { ecmaVersion: 2020, sourceType: 'module', project: FIXTURE_TSCONFIG },
        },
        plugins: {
          probe: {
            rules: {
              x: {
                create: (context: unknown) => ({
                  Identifier: (node: unknown): void => {
                    found.push(typedParserServicesTransformer({ context, node }));
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

  it('VALID: {shorthand property value reading an ambient global} => returns the global declaration file for the value, the literal for the key', () => {
    const found: ReturnType<typeof typedParserServicesTransformer>[] = [];
    const linter = new Linter({ configType: 'flat' });

    linter.verify(
      'const holder = { process };',
      {
        files: ['**/*.ts'],
        languageOptions: {
          parser: tsParser,
          parserOptions: { ecmaVersion: 2020, sourceType: 'module', project: FIXTURE_TSCONFIG },
        },
        plugins: {
          probe: {
            rules: {
              x: {
                create: (context: unknown) => ({
                  Identifier: (node: unknown): void => {
                    found.push(typedParserServicesTransformer({ context, node }));
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

    expect(found).toStrictEqual([
      REAL_FILE,
      REAL_FILE,
      `${REPO_ROOT}/node_modules/@types/node/globals.d.ts`,
    ]);
  });
});
