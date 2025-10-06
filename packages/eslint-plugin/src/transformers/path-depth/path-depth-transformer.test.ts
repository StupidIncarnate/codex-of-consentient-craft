import { pathDepthTransformer } from './path-depth-transformer';

describe('pathDepthTransformer', () => {
  describe('pathDepth()', () => {
    it('VALID: 1-level path returns 1', () => {
      const result = pathDepthTransformer({
        filePath: 'src/contracts/user/user-contract.ts',
      });

      expect(result).toBe(1);
    });

    it('VALID: 2-level path returns 2', () => {
      const result = pathDepthTransformer({
        filePath: 'src/brokers/user/fetch/user-fetch-broker.ts',
      });

      expect(result).toBe(2);
    });

    it('EDGE: direct file in folder returns 0', () => {
      const result = pathDepthTransformer({
        filePath: 'src/statics/api-statics.ts',
      });

      expect(result).toBe(0);
    });

    it('EDGE: file not in src/ returns 0', () => {
      const result = pathDepthTransformer({
        filePath: 'packages/eslint-plugin/index.ts',
      });

      expect(result).toBe(0);
    });

    it('VALID: complex nested path calculates correctly', () => {
      const result = pathDepthTransformer({
        filePath: 'src/brokers/domain/user/profile/fetch/user-profile-fetch-broker.ts',
      });

      expect(result).toBe(4);
    });

    it('VALID: 1-level path with different folder type returns 1', () => {
      const result = pathDepthTransformer({
        filePath: 'src/statics/api/api-statics.ts',
      });

      expect(result).toBe(1);
    });

    it('EDGE: absolute path with src/ returns correct depth', () => {
      const result = pathDepthTransformer({
        filePath: '/home/user/project/src/contracts/auth/auth-contract.ts',
      });

      expect(result).toBe(1);
    });

    it('EDGE: path with no folder type after src/ returns 0', () => {
      const result = pathDepthTransformer({
        filePath: 'src/index.ts',
      });

      expect(result).toBe(0);
    });

    it('VALID: 3-level path returns 3', () => {
      const result = pathDepthTransformer({
        filePath: 'src/guards/domain/user/profile/user-profile-guard.ts',
      });

      expect(result).toBe(3);
    });
  });
});
