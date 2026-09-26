import { tsconfigPathsMapContract } from './tsconfig-paths-map-contract';
import { TsconfigPathsMapStub } from './tsconfig-paths-map.stub';

describe('tsconfigPathsMapContract', () => {
  describe('valid inputs', () => {
    it('VALID: {one two-entry array value} => parses successfully', () => {
      const result = tsconfigPathsMapContract.parse({
        '#gateway/npm/*': [
          './packages/@gateway/npm/src/*/index.ts',
          './packages/@gateway/npm/src/*',
        ],
      });

      expect(result).toStrictEqual({
        '#gateway/npm/*': [
          './packages/@gateway/npm/src/*/index.ts',
          './packages/@gateway/npm/src/*',
        ],
      });
    });

    it('VALID: {} => parses empty object', () => {
      const result = tsconfigPathsMapContract.parse({});

      expect(result).toStrictEqual({});
    });
  });

  describe('TsconfigPathsMapStub', () => {
    it('VALID: {} => returns the default two-entry stub', () => {
      const result = TsconfigPathsMapStub();

      expect(result).toStrictEqual({
        '#gateway/npm/*': [
          './packages/@gateway/npm/src/*/index.ts',
          './packages/@gateway/npm/src/*',
        ],
      });
    });
  });
});
