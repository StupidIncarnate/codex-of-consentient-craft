import { Linter } from '#gateway/npm/eslint';
import * as tsParser from '#gateway/npm/typescript-eslint__parser';
import { IdentifierStub } from '@dungeonmaster/shared/contracts/identifier/identifier.stub';
import { voidSinkSpyLayerBroker } from './void-sink-spy-layer-broker';

describe('voidSinkSpyLayerBroker', () => {
  it.each([
    ['VALID: {process.stderr, write} => true', 'process.stderr', 'write', true],
    ['VALID: {process.stdout, write} => true', 'process.stdout', 'write', true],
    ['VALID: {process, on} => true', 'process', 'on', true],
    ['INVALID: {process, write} => false', 'process', 'write', false],
    ['INVALID: {process.stderr, on} => false', 'process.stderr', 'on', false],
    ['INVALID: {process.stdin, write} => false', 'process.stdin', 'write', false],
    ['INVALID: {socket, write} => false', 'socket', 'write', false],
    ['INVALID: {other.stderr, write} => false', 'other.stderr', 'write', false],
    ['VALID: {imported stderr, write} => true', 'stderr', 'write', true, ['stderr']],
    ['VALID: {imported stdout, write} => true', 'stdout', 'write', true, ['stdout']],
    ['VALID: {aliased sink, write} => true', 'sink', 'write', true, ['sink']],
    ['INVALID: {stderr not imported, write} => false', 'stderr', 'write', false, ['stdout']],
    ['INVALID: {imported stderr, on} => false', 'stderr', 'on', false, ['stderr']],
  ])('%s', (_name, objectCode, method, expected, sinkNames: string[] = []) => {
    const gatewaySinkNames = new Set(sinkNames.map((name) => IdentifierStub({ value: name })));
    const found: boolean[] = [];
    const linter = new Linter({ configType: 'flat' });

    linter.verify(
      `spy({ object: ${objectCode} });`,
      {
        files: ['**/*.ts'],
        languageOptions: { parser: tsParser },
        plugins: {
          probe: {
            rules: {
              x: {
                create: () => ({
                  'Property[key.name="object"] > .value': (objectNode: unknown): void => {
                    found.push(voidSinkSpyLayerBroker({ objectNode, method, gatewaySinkNames }));
                  },
                }),
              },
            },
          },
        },
        rules: { 'probe/x': 'error' },
      },
      { filename: 'probe.ts' },
    );

    expect(found).toStrictEqual([expected]);
  });
});
