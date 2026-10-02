import { isBanAmbientModuleResolveExemptFileGuard } from './is-ban-ambient-module-resolve-exempt-file-guard';

describe('isBanAmbientModuleResolveExemptFileGuard', () => {
  describe('exempt files', () => {
    it.each([
      '/repo/packages/shared/src/brokers/module/resolve/module-resolve-broker.ts',
      '/repo/packages/@gateway/node/src/module/resolve/resolve.ts',
      '/repo/packages/cli/src/brokers/a/b/a-b-broker.test.ts',
      '/repo/packages/cli/src/brokers/a/b/a-b-broker.proxy.ts',
      '/repo/packages/cli/src/contracts/a/a.stub.ts',
      '/repo/packages/cli/test/harnesses/a/a.harness.ts',
      '/repo/packages/cli/src/startup/start-cli.integration.test.ts',
      'C:\\repo\\packages\\cli\\src\\a.test.ts',
    ])('VALID: {filename: %s} => returns true', (filename) => {
      expect(isBanAmbientModuleResolveExemptFileGuard({ filename })).toBe(true);
    });
  });

  describe('production files', () => {
    it('VALID: {production broker} => returns false', () => {
      expect(
        isBanAmbientModuleResolveExemptFileGuard({
          filename: '/repo/packages/cli/src/brokers/a/b/a-b-broker.ts',
        }),
      ).toBe(false);
    });

    it('VALID: {sibling of the resolve broker} => returns false', () => {
      expect(
        isBanAmbientModuleResolveExemptFileGuard({
          filename: '/repo/packages/shared/src/brokers/module/resolve/other-layer-broker.ts',
        }),
      ).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {filename: undefined} => returns false', () => {
      expect(isBanAmbientModuleResolveExemptFileGuard({})).toBe(false);
    });

    it('EMPTY: {filename: ""} => returns false', () => {
      expect(isBanAmbientModuleResolveExemptFileGuard({ filename: '' })).toBe(false);
    });
  });
});
