import { contractIndexStatics } from './contract-index-statics';

describe('contractIndexStatics', () => {
  describe('scan', () => {
    it('VALID: {contractIndexStatics} => scans .ts and .tsx and treats @-prefixed folders as scopes', () => {
      expect(contractIndexStatics).toStrictEqual({
        scan: {
          sourceSuffixes: ['.ts', '.tsx'],
          scopeFolderPrefix: '@',
        },
        parse: {
          methodNames: ['parse', 'safeParse', 'parseAsync', 'safeParseAsync'],
        },
        types: {
          inferNames: ['infer', 'input', 'output'],
          wrapperNames: ['Omit', 'Pick', 'Partial', 'Required', 'Readonly'],
        },
        resolve: {
          fileSuffixes: ['', '.ts', '.tsx', '/index.ts', '/index.tsx'],
        },
      });
    });
  });
});
