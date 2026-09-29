import { Linter } from '#gateway/npm/eslint';
import * as tsParser from '#gateway/npm/typescript-eslint__parser';
import { typedSpyMethodTakesNoArgsLayerBroker } from './typed-spy-method-takes-no-args-layer-broker';

// Real ESLint + real TypeScript program, the way typedFunctionTakesNoArgsTransformer is exercised:
// the broker only resolves anything once a full typed lint pass has built one. Each snippet declares
// one `spy({ object })` call; the probe hands the `object` node, and the case's method name, to the
// broker. The filename is this package's own real src/index.ts so `project: true` finds a tsconfig.
const REAL_FILE = `${__dirname.split('/brokers/')[0]}/index.ts`;

describe('typedSpyMethodTakesNoArgsLayerBroker', () => {
  it.each([
    ['INVALID: {process.stderr, write} => returns false', 'process.stderr', 'write', false],
    ['VALID: {process, cwd} => returns true', 'process', 'cwd', true],
    ['VALID: {Math, random} => returns true', 'Math', 'random', true],
    ['EMPTY: {process, no such method} => returns undefined', 'process', 'nope', undefined],
    ['EMPTY: {process, non-callable property} => returns undefined', 'process', 'pid', undefined],
  ])('%s', (_name, objectCode, method, expected) => {
    const found: ReturnType<typeof typedSpyMethodTakesNoArgsLayerBroker>[] = [];
    const linter = new Linter({ configType: 'flat' });

    linter.verify(
      `spy({ object: ${objectCode} });`,
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
                  'Property[key.name="object"] > .value': (objectNode: unknown): void => {
                    found.push(
                      typedSpyMethodTakesNoArgsLayerBroker({ context, objectNode, method }),
                    );
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

    expect(found).toStrictEqual([expected]);
  });
});
