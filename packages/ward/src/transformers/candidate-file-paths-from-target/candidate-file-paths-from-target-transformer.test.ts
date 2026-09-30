import { candidateFilePathsFromTargetTransformer } from './candidate-file-paths-from-target-transformer';

describe('candidateFilePathsFromTargetTransformer', () => {
  describe('valid inputs', () => {
    it('VALID: {target} => returns the four candidates in resolution order', () => {
      const result = candidateFilePathsFromTargetTransformer({
        target: '/repo/packages/node/fs',
      });

      expect(result).toStrictEqual([
        '/repo/packages/node/fs.ts',
        '/repo/packages/node/fs.tsx',
        '/repo/packages/node/fs/index.ts',
        '/repo/packages/node/fs/index.tsx',
      ]);
    });
  });
});
