import { resolveRelativeSpecifierTransformer } from './resolve-relative-specifier-transformer';

describe('resolveRelativeSpecifierTransformer', () => {
  describe('valid inputs', () => {
    it('VALID: {fromDir, specifier: "./chat-widget"} => joins onto the same directory', () => {
      const result = resolveRelativeSpecifierTransformer({
        fromDir: '/repo/packages/web/src/widgets',
        specifier: './chat-widget',
      });

      expect(result).toBe('/repo/packages/web/src/widgets/chat-widget');
    });

    it('VALID: {fromDir, specifier: "../shared/foo"} => walks up one directory', () => {
      const result = resolveRelativeSpecifierTransformer({
        fromDir: '/repo/packages/web/src/widgets',
        specifier: '../shared/foo',
      });

      expect(result).toBe('/repo/packages/web/src/shared/foo');
    });

    it('VALID: {fromDir, specifier: "../../other"} => walks up two directories', () => {
      const result = resolveRelativeSpecifierTransformer({
        fromDir: '/repo/packages/web/src/widgets',
        specifier: '../../other',
      });

      expect(result).toBe('/repo/packages/web/other');
    });
  });

  describe('edge cases', () => {
    it('EDGE: {specifier: "."} => returns fromDir unchanged', () => {
      const result = resolveRelativeSpecifierTransformer({
        fromDir: '/repo/packages/web/src',
        specifier: '.',
      });

      expect(result).toBe('/repo/packages/web/src');
    });
  });
});
