import { Linter } from 'eslint';
import * as tsParser from '@typescript-eslint/parser';
import { eslintTypedTypeParameterNameAdapter } from './eslint-typed-type-parameter-name-adapter';

// Real ESLint + real TypeScript program: parserServices only exist once a full typed lint pass has
// built one, so this exercises the adapter the same way platform-globals-ban does, against this
// package's own real file rather than a synthetic fixture. Built by slicing `__dirname`'s own
// segments, not `path.join`, so the filename carries no unresolved `..` for
// `parserOptions.project: true` to walk from.
const DIR_SEGMENTS = __dirname.split('/');
const REAL_FILE = `${DIR_SEGMENTS.slice(0, -3).join('/')}/index.ts`;

describe('eslintTypedTypeParameterNameAdapter', () => {
  it("VALID: {identifier resolving to the enclosing function's own type parameter} => returns its name", () => {
    const found: ReturnType<typeof eslintTypedTypeParameterNameAdapter>[] = [];
    const linter = new Linter({ configType: 'flat' });

    linter.verify(
      'const wrap = <T,>(text: string): T => JSON.parse(text) as T;',
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
                  // Mirrors exactly what the rule passes: the Identifier under a cast's
                  // TSTypeReference (`typeAnnotation.typeName`), never the TSTypeReference itself.
                  'TSAsExpression > TSTypeReference > Identifier': (node: unknown): void => {
                    found.push(eslintTypedTypeParameterNameAdapter({ context, node }));
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
    const found: ReturnType<typeof eslintTypedTypeParameterNameAdapter>[] = [];
    const linter = new Linter({ configType: 'flat' });

    linter.verify(
      'interface Settings { name: string }\nconst wrap = (text: string): Settings => JSON.parse(text) as Settings;',
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
                  'TSAsExpression > TSTypeReference > Identifier': (node: unknown): void => {
                    found.push(eslintTypedTypeParameterNameAdapter({ context, node }));
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
    const found: ReturnType<typeof eslintTypedTypeParameterNameAdapter>[] = [];
    const linter = new Linter({ configType: 'flat' });

    linter.verify(
      'const wrap = (text: string): Error => JSON.parse(text) as Error;',
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
                  'TSAsExpression > TSTypeReference > Identifier': (node: unknown): void => {
                    found.push(eslintTypedTypeParameterNameAdapter({ context, node }));
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
