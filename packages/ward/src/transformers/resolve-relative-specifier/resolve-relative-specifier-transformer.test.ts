import { resolveRelativeSpecifierTransformer } from './resolve-relative-specifier-transformer';
import { ModuleSpecifierStub } from '../../contracts/module-specifier/module-specifier.stub';

describe('resolveRelativeSpecifierTransformer', () => {
  describe('valid inputs', () => {
    it('VALID: {fromDir, specifier: "./chat-widget"} => joins onto the same directory', () => {
      const result = resolveRelativeSpecifierTransformer({
        fromDir: '/repo/packages/web/src/widgets',
        specifier: ModuleSpecifierStub({ value: './chat-widget' }),
      });

      expect(result).toBe('/repo/packages/web/src/widgets/chat-widget');
    });

    it('VALID: {fromDir, specifier: "../shared/foo"} => walks up one directory', () => {
      const result = resolveRelativeSpecifierTransformer({
        fromDir: '/repo/packages/web/src/widgets',
        specifier: ModuleSpecifierStub({ value: '../shared/foo' }),
      });

      expect(result).toBe('/repo/packages/web/src/shared/foo');
    });

    it('VALID: {fromDir, specifier: "../../other"} => walks up two directories', () => {
      const result = resolveRelativeSpecifierTransformer({
        fromDir: '/repo/packages/web/src/widgets',
        specifier: ModuleSpecifierStub({ value: '../../other' }),
      });

      expect(result).toBe('/repo/packages/web/other');
    });
  });

  describe('edge cases', () => {
    it('EDGE: {specifier: "."} => returns fromDir unchanged', () => {
      const result = resolveRelativeSpecifierTransformer({
        fromDir: '/repo/packages/web/src',
        specifier: ModuleSpecifierStub({ value: '.' }),
      });

      expect(result).toBe('/repo/packages/web/src');
    });
  });
});
