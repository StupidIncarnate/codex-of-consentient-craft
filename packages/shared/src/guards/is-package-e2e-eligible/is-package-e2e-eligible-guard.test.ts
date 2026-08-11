import { PackageJsonStub } from '../../contracts/package-json/package-json.stub';
import { isPackageE2eEligibleGuard } from './is-package-e2e-eligible-guard';

describe('isPackageE2eEligibleGuard', () => {
  describe('eligible signals', () => {
    it('VALID: {srcDirNames: [widgets], packageJson.dependencies.react} => returns true', () => {
      const result = isPackageE2eEligibleGuard({
        srcDirNames: ['widgets', 'bindings'],
        packageJson: PackageJsonStub({ dependencies: { react: '18.2.0' } }),
      });

      expect(result).toBe(true);
    });

    it('VALID: {srcDirNames: [widgets], adapterDirNames: [ink]} => returns true', () => {
      const result = isPackageE2eEligibleGuard({
        srcDirNames: ['widgets', 'adapters'],
        adapterDirNames: ['ink'],
      });

      expect(result).toBe(true);
    });

    it('VALID: {srcDirNames: [widgets], adapterDirNames: [ink], packageJson.dependencies.react} => returns true', () => {
      const result = isPackageE2eEligibleGuard({
        srcDirNames: ['widgets'],
        adapterDirNames: ['ink'],
        packageJson: PackageJsonStub({ dependencies: { react: '18.2.0' } }),
      });

      expect(result).toBe(true);
    });
  });

  describe('precedence trap: widgets + react + hono', () => {
    it('VALID: {srcDirNames: [widgets], adapterDirNames: [hono], packageJson.dependencies.react} => returns true regardless of the hono adapter', () => {
      // detectPackageTypeLayerBroker's rule 1 (hono/express) would classify this package
      // 'http-backend' before its rule 4 (widgets+react) is ever reached. This guard does not
      // consult that winning label — it reads the widgets+react signals directly, so the hono
      // adapter present alongside them cannot hide e2e eligibility.
      const result = isPackageE2eEligibleGuard({
        srcDirNames: ['widgets', 'adapters'],
        adapterDirNames: ['hono'],
        packageJson: PackageJsonStub({ dependencies: { react: '18.2.0' } }),
      });

      expect(result).toBe(true);
    });

    it('VALID: {srcDirNames: [widgets], adapterDirNames: [hono, ink]} => returns true regardless of the hono adapter', () => {
      const result = isPackageE2eEligibleGuard({
        srcDirNames: ['widgets', 'adapters'],
        adapterDirNames: ['hono', 'ink'],
      });

      expect(result).toBe(true);
    });
  });

  describe('non-eligible signals', () => {
    it('INVALID: {srcDirNames: [brokers], packageJson.dependencies.react} => returns false without a widgets folder', () => {
      const result = isPackageE2eEligibleGuard({
        srcDirNames: ['brokers', 'contracts'],
        packageJson: PackageJsonStub({ dependencies: { react: '18.2.0' } }),
      });

      expect(result).toBe(false);
    });

    it('INVALID: {srcDirNames: [widgets], adapterDirNames: [fetch]} => returns false without react or ink', () => {
      const result = isPackageE2eEligibleGuard({
        srcDirNames: ['widgets'],
        adapterDirNames: ['fetch'],
        packageJson: PackageJsonStub({ dependencies: { zod: '3.25.0' } }),
      });

      expect(result).toBe(false);
    });

    it('INVALID: {srcDirNames: [widgets], adapterDirNames: [hono]} => returns false without react or ink even with hono present', () => {
      const result = isPackageE2eEligibleGuard({
        srcDirNames: ['widgets'],
        adapterDirNames: ['hono'],
      });

      expect(result).toBe(false);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {} => returns false', () => {
      const result = isPackageE2eEligibleGuard({});

      expect(result).toBe(false);
    });

    it('EMPTY: {srcDirNames: []} => returns false', () => {
      const result = isPackageE2eEligibleGuard({ srcDirNames: [] });

      expect(result).toBe(false);
    });
  });
});
