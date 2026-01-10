import { tsToTsxPathTransformer } from './ts-to-tsx-path-transformer';

describe('tsToTsxPathTransformer', () => {
  describe('path conversion', () => {
    it('VALID: {tsPath: "/src/widgets/user/user-widget.ts"} => returns .tsx path', () => {
      const result = tsToTsxPathTransformer({ tsPath: '/src/widgets/user/user-widget.ts' });

      expect(result).toBe('/src/widgets/user/user-widget.tsx');
    });

    it('VALID: {tsPath: "/src/adapters/ink/box/ink-box-adapter.ts"} => returns .tsx path', () => {
      const result = tsToTsxPathTransformer({ tsPath: '/src/adapters/ink/box/ink-box-adapter.ts' });

      expect(result).toBe('/src/adapters/ink/box/ink-box-adapter.tsx');
    });

    it('EDGE: {tsPath: "/src/file.ts.ts"} => only replaces final .ts', () => {
      const result = tsToTsxPathTransformer({ tsPath: '/src/file.ts.ts' });

      expect(result).toBe('/src/file.ts.tsx');
    });
  });
});
