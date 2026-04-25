import { isLocationLiteralAllowlistedGuard } from './is-location-literal-allowlisted-guard';

describe('isLocationLiteralAllowlistedGuard', () => {
  describe('missing filename', () => {
    it('EMPTY: {} => returns false', () => {
      expect(isLocationLiteralAllowlistedGuard({})).toBe(false);
    });

    it('EMPTY: {filename: ""} => returns false', () => {
      expect(isLocationLiteralAllowlistedGuard({ filename: '' })).toBe(false);
    });
  });

  describe('allowlisted locations-statics path', () => {
    it('VALID: locations statics file => returns true', () => {
      expect(
        isLocationLiteralAllowlistedGuard({
          filename: '/repo/packages/shared/src/statics/locations/locations-statics.ts',
        }),
      ).toBe(true);
    });
  });

  describe('allowlisted locations-broker path', () => {
    it('VALID: locations resolver broker file => returns true', () => {
      expect(
        isLocationLiteralAllowlistedGuard({
          filename:
            '/repo/packages/shared/src/brokers/locations/mcp-json-path-find/mcp-json-path-find-broker.ts',
        }),
      ).toBe(true);
    });
  });

  describe('allowlisted test/stub/proxy/harness paths', () => {
    it.each([
      '/repo/packages/web/src/widgets/foo/foo-widget.test.ts',
      '/repo/packages/web/src/widgets/foo/foo-widget.test.tsx',
      '/repo/packages/web/src/widgets/foo/foo-widget.stub.ts',
      '/repo/packages/web/src/widgets/foo/foo-widget.proxy.ts',
      '/repo/packages/web/src/widgets/foo/foo-widget.spec.ts',
      '/repo/packages/web/src/widgets/foo/foo-widget.integration.test.ts',
      '/repo/packages/web/src/widgets/foo/foo-widget.e2e.test.ts',
      '/repo/packages/web/test/harnesses/quest/quest.harness.ts',
    ] as const)('VALID: {filename: %s} => returns true', (filename) => {
      expect(isLocationLiteralAllowlistedGuard({ filename })).toBe(true);
    });
  });

  describe('non-allowlisted production paths', () => {
    it.each([
      '/repo/packages/web/src/widgets/foo/foo-widget.ts',
      '/repo/packages/orchestrator/src/brokers/quest/get/quest-get-broker.ts',
      '/repo/packages/server/src/responders/quest/get/quest-get-responder.ts',
      // Other shared brokers (NOT under brokers/locations/) are still subject to the rule.
      '/repo/packages/shared/src/brokers/find-config-root/find-config-root-broker.ts',
      // Other shared statics (NOT under statics/locations/) are still subject to the rule.
      '/repo/packages/shared/src/statics/dungeonmaster-home/dungeonmaster-home-statics.ts',
    ] as const)('EMPTY: {filename: %s} => returns false', (filename) => {
      expect(isLocationLiteralAllowlistedGuard({ filename })).toBe(false);
    });
  });

  describe('windows-style paths', () => {
    it('VALID: Windows-style path with backslashes => normalized and matched', () => {
      expect(
        isLocationLiteralAllowlistedGuard({
          filename: 'C:\\repo\\packages\\shared\\src\\statics\\locations\\locations-statics.ts',
        }),
      ).toBe(true);
    });
  });
});
