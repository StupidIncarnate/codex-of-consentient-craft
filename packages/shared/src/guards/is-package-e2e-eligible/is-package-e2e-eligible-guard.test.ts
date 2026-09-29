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

    it('VALID: {srcDirNames: [widgets], ink in deps} => returns true', () => {
      const result = isPackageE2eEligibleGuard({
        srcDirNames: ['widgets'],
        packageJson: PackageJsonStub({ dependencies: { ink: '^5.0.0' } }),
      });

      expect(result).toBe(true);
    });

    it('VALID: {srcDirNames: [widgets], ink and react in deps} => returns true', () => {
      const result = isPackageE2eEligibleGuard({
        srcDirNames: ['widgets'],
        packageJson: PackageJsonStub({ dependencies: { ink: '^5.0.0', react: '18.2.0' } }),
      });

      expect(result).toBe(true);
    });
  });

  describe('precedence trap: widgets + react + hono', () => {
    it('VALID: {srcDirNames: [widgets], hono and react in deps} => returns true regardless of hono', () => {
      // detectPackageTypeLayerBroker's http-backend rule would classify this package
      // 'http-backend' before its widgets+react rule is ever reached. This guard does not
      // consult that winning label — it reads the widgets+react signals directly, so the hono
      // dependency present alongside them cannot hide e2e eligibility.
      const result = isPackageE2eEligibleGuard({
        srcDirNames: ['widgets', 'flows'],
        packageJson: PackageJsonStub({ dependencies: { hono: '^4.0.0', react: '18.2.0' } }),
      });

      expect(result).toBe(true);
    });

    it('VALID: {srcDirNames: [widgets], hono and ink in deps} => returns true regardless of hono', () => {
      const result = isPackageE2eEligibleGuard({
        srcDirNames: ['widgets', 'flows'],
        packageJson: PackageJsonStub({ dependencies: { hono: '^4.0.0', ink: '^5.0.0' } }),
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

    it('INVALID: {srcDirNames: [widgets], zod in deps} => returns false without react or ink', () => {
      const result = isPackageE2eEligibleGuard({
        srcDirNames: ['widgets'],
        packageJson: PackageJsonStub({ dependencies: { zod: '3.25.0' } }),
      });

      expect(result).toBe(false);
    });

    it('INVALID: {srcDirNames: [widgets], hono in deps} => returns false without react or ink even with hono present', () => {
      const result = isPackageE2eEligibleGuard({
        srcDirNames: ['widgets'],
        packageJson: PackageJsonStub({ dependencies: { hono: '^4.0.0' } }),
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
