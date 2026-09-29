import { Linter } from '#gateway/npm/eslint';
import * as tsParser from '#gateway/npm/typescript-eslint__parser';
import { typedTypeParameterNameTransformer } from './typed-type-parameter-name-transformer';

// Real ESLint + real TypeScript program: parserServices only exist once a typed lint pass has built
// one. Each case parses against a one-file fixture tsconfig instead of the package's own program,
// which holds every source file of the package while the transformer only asks the checker what one
// identifier resolves to. `REAL_FILE` is that fixture's only file. Built by slicing `__dirname`'s own
// segments, not `path.join`, so the filename carries no unresolved `..`.
const DIR_SEGMENTS = __dirname.split('/');
const PACKAGE_ROOT = DIR_SEGMENTS.slice(0, -3).join('/');
const FIXTURE_TSCONFIG = `${PACKAGE_ROOT}/test/fixtures/typed-transformers/tsconfig.node.json`;
const REAL_FILE = `${PACKAGE_ROOT}/src/statics/regex-match-methods/regex-match-methods-statics.ts`;

describe('typedTypeParameterNameTransformer', () => {
  it("VALID: {identifier resolving to the enclosing function's own type parameter} => returns its name", () => {
    const found: ReturnType<typeof typedTypeParameterNameTransformer>[] = [];
    const linter = new Linter({ configType: 'flat' });

    linter.verify(
      'const wrap = <T,>(text: string): T => JSON.parse(text) as T;',
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
                  // Mirrors exactly what the rule passes: the Identifier under a cast's
                  // TSTypeReference (`typeAnnotation.typeName`), never the TSTypeReference itself.
                  'TSAsExpression > TSTypeReference > Identifier': (node: unknown): void => {
                    found.push(typedTypeParameterNameTransformer({ context, node }));
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

    expect(found).toStrictEqual(['T']);
  });

  it('EMPTY: {identifier resolving to a real interface} => returns undefined', () => {
    const found: ReturnType<typeof typedTypeParameterNameTransformer>[] = [];
    const linter = new Linter({ configType: 'flat' });

    linter.verify(
      'interface Settings { name: string }\nconst wrap = (text: string): Settings => JSON.parse(text) as Settings;',
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
                  'TSAsExpression > TSTypeReference > Identifier': (node: unknown): void => {
                    found.push(typedTypeParameterNameTransformer({ context, node }));
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

  it('EMPTY: {identifier resolving to a lib type} => returns undefined', () => {
    const found: ReturnType<typeof typedTypeParameterNameTransformer>[] = [];
    const linter = new Linter({ configType: 'flat' });

    linter.verify(
      'const wrap = (text: string): Error => JSON.parse(text) as Error;',
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
                  'TSAsExpression > TSTypeReference > Identifier': (node: unknown): void => {
                    found.push(typedTypeParameterNameTransformer({ context, node }));
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
