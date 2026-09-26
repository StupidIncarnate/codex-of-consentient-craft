import { nonImplementationGlobsStatics } from './non-implementation-globs-statics';

describe('nonImplementationGlobsStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(nonImplementationGlobsStatics).toStrictEqual([
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.proxy.ts',
      '**/*.proxy.tsx',
      '**/*.stub.ts',
      '**/*.harness.ts',
      '**/*.d.ts',
    ]);
  });
});
