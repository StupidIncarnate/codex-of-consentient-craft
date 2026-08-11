import { PackageJsonStub } from '../../contracts/package-json/package-json.stub';
import { packageBrowserTypeTransformer } from './package-browser-type-transformer';

describe('packageBrowserTypeTransformer', () => {
  describe('browser-reachable signals', () => {
    it('VALID: {srcDirNames: [widgets], packageJson.dependencies.react} => returns frontend-react', () => {
      const result = packageBrowserTypeTransformer({
        srcDirNames: ['widgets', 'bindings'],
        packageJson: PackageJsonStub({ dependencies: { react: '18.2.0' } }),
      });

      expect(result).toBe('frontend-react');
    });

    it('VALID: {srcDirNames: [widgets], adapterDirNames: [ink]} => returns frontend-ink', () => {
      const result = packageBrowserTypeTransformer({
        srcDirNames: ['widgets', 'adapters'],
        adapterDirNames: ['ink'],
      });

      expect(result).toBe('frontend-ink');
    });

    it('VALID: {srcDirNames: [widgets], adapterDirNames: [ink], react in deps} => returns frontend-ink, the surface a run actually drives', () => {
      const result = packageBrowserTypeTransformer({
        srcDirNames: ['widgets'],
        adapterDirNames: ['ink'],
        packageJson: PackageJsonStub({ dependencies: { react: '18.2.0' } }),
      });

      expect(result).toBe('frontend-ink');
    });
  });

  describe('precedence trap: widgets + react + hono', () => {
    it('VALID: {srcDirNames: [widgets], adapterDirNames: [hono], react in deps} => returns frontend-react regardless of the hono adapter', () => {
      const result = packageBrowserTypeTransformer({
        srcDirNames: ['widgets', 'adapters'],
        adapterDirNames: ['hono'],
        packageJson: PackageJsonStub({ dependencies: { react: '18.2.0' } }),
      });

      expect(result).toBe('frontend-react');
    });

    it('VALID: {srcDirNames: [widgets], adapterDirNames: [hono, ink]} => returns frontend-ink regardless of the hono adapter', () => {
      const result = packageBrowserTypeTransformer({
        srcDirNames: ['widgets', 'adapters'],
        adapterDirNames: ['hono', 'ink'],
      });

      expect(result).toBe('frontend-ink');
    });
  });

  describe('non-reachable signals', () => {
    it('INVALID: {srcDirNames: [brokers], react in deps} => returns undefined without a widgets folder', () => {
      const result = packageBrowserTypeTransformer({
        srcDirNames: ['brokers', 'contracts'],
        packageJson: PackageJsonStub({ dependencies: { react: '18.2.0' } }),
      });

      expect(result).toBe(undefined);
    });

    it('INVALID: {srcDirNames: [widgets], adapterDirNames: [fetch]} => returns undefined without react or ink', () => {
      const result = packageBrowserTypeTransformer({
        srcDirNames: ['widgets'],
        adapterDirNames: ['fetch'],
        packageJson: PackageJsonStub({ dependencies: { zod: '3.25.0' } }),
      });

      expect(result).toBe(undefined);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {} => returns undefined', () => {
      const result = packageBrowserTypeTransformer({});

      expect(result).toBe(undefined);
    });

    it('EMPTY: {srcDirNames: []} => returns undefined', () => {
      const result = packageBrowserTypeTransformer({ srcDirNames: [] });

      expect(result).toBe(undefined);
    });
  });
});
