import { nonImplementationFileSuffixesStatics } from './non-implementation-file-suffixes-statics';

describe('nonImplementationFileSuffixesStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(nonImplementationFileSuffixesStatics).toStrictEqual([
      '.test.ts',
      '.test.tsx',
      '.proxy.ts',
      '.proxy.tsx',
      '.stub.ts',
      '.harness.ts',
      '.integration.test.ts',
      '.e2e.ts',
      '.d.ts',
    ]);
  });
});
