import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { relativePathComputeTransformer } from './relative-path-compute-transformer';

describe('relativePathComputeTransformer', () => {
  describe('same path', () => {
    it('EDGE: {from and to are identical} => returns "."', () => {
      const result = relativePathComputeTransformer({
        from: AbsoluteFilePathStub({ value: '/repo/packages/shared' }),
        to: AbsoluteFilePathStub({ value: '/repo/packages/shared' }),
      });

      expect(String(result)).toBe('.');
    });
  });

  describe('sibling packages', () => {
    it('VALID: {from=orchestrator, to=shared} => returns "../shared"', () => {
      const result = relativePathComputeTransformer({
        from: AbsoluteFilePathStub({ value: '/repo/packages/orchestrator' }),
        to: AbsoluteFilePathStub({ value: '/repo/packages/shared' }),
      });

      expect(String(result)).toBe('../shared');
    });
  });

  describe('descendant (root to subpackage)', () => {
    it('VALID: {from=repo root, to=packages/shared} => returns "./packages/shared"', () => {
      const result = relativePathComputeTransformer({
        from: AbsoluteFilePathStub({ value: '/repo' }),
        to: AbsoluteFilePathStub({ value: '/repo/packages/shared' }),
      });

      expect(String(result)).toBe('./packages/shared');
    });
  });

  describe('ancestor (subpackage to root)', () => {
    it('VALID: {from=packages/shared, to=repo root} => returns "../.."', () => {
      const result = relativePathComputeTransformer({
        from: AbsoluteFilePathStub({ value: '/repo/packages/shared' }),
        to: AbsoluteFilePathStub({ value: '/repo' }),
      });

      expect(String(result)).toBe('../..');
    });
  });

  describe('completely different paths', () => {
    it('VALID: {from=/a/b/c, to=/x/y/z} => returns "../../../x/y/z"', () => {
      const result = relativePathComputeTransformer({
        from: AbsoluteFilePathStub({ value: '/a/b/c' }),
        to: AbsoluteFilePathStub({ value: '/x/y/z' }),
      });

      expect(String(result)).toBe('../../../x/y/z');
    });
  });
});
