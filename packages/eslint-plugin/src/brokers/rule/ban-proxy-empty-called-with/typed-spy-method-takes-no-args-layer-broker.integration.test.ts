import { Linter } from '#gateway/npm/eslint';
import * as tsParser from '#gateway/npm/typescript-eslint__parser';
import { typedSpyMethodTakesNoArgsLayerBroker } from './typed-spy-method-takes-no-args-layer-broker';

// Real ESLint + real TypeScript program, the way typedFunctionTakesNoArgsTransformer is exercised:
// the broker only resolves anything once a full typed lint pass has built one. Each snippet declares
// one `spy({ object })` call; the probe hands the `object` node, and the case's method name, to the
// broker. The filename is a tiny real statics file that a two-file fixture tsconfig names, so the
// program holds that file and the lib, not every source file of the package.
const [SRC_DIR] = __dirname.split('/brokers/');
const REAL_FILE = `${SRC_DIR}/statics/regex-match-methods/regex-match-methods-statics.ts`;
const FIXTURE_TSCONFIG = `${SRC_DIR}/../test/fixtures/ban-proxy-empty-called-with/tsconfig.node.json`;

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
          parserOptions: { ecmaVersion: 2020, sourceType: 'module', project: FIXTURE_TSCONFIG },
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
