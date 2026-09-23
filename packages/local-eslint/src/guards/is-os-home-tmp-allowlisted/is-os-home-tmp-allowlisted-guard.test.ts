import { isOsHomeTmpAllowlistedGuard } from './is-os-home-tmp-allowlisted-guard';

describe('isOsHomeTmpAllowlistedGuard', () => {
  describe('missing input', () => {
    it('EMPTY: {} => returns false', () => {
      expect(isOsHomeTmpAllowlistedGuard({})).toBe(false);
    });

    it('EMPTY: {filename: ""} => returns false', () => {
      expect(isOsHomeTmpAllowlistedGuard({ filename: '', kind: 'homedir' })).toBe(false);
    });

    it('EMPTY: {kind: undefined} => returns false', () => {
      expect(isOsHomeTmpAllowlistedGuard({ filename: '/repo/packages/web/src/foo/foo.ts' })).toBe(
        false,
      );
    });
  });

  describe('OS adapter layer', () => {
    it('VALID: {filename: an os adapter, kind: homedir} => returns true', () => {
      expect(
        isOsHomeTmpAllowlistedGuard({
          filename: '/repo/packages/shared/src/adapters/os/homedir/os-homedir-adapter.ts',
          kind: 'homedir',
        }),
      ).toBe(true);
    });

    it('VALID: {filename: an os adapter, kind: tmpdir} => returns true', () => {
      expect(
        isOsHomeTmpAllowlistedGuard({
          filename: '/repo/packages/shared/src/adapters/os/tmpdir/os-tmpdir-adapter.ts',
          kind: 'tmpdir',
        }),
      ).toBe(true);
    });

    it('VALID: Windows-style path with backslashes => normalized and matched', () => {
      expect(
        isOsHomeTmpAllowlistedGuard({
          filename: 'C:\\repo\\packages\\shared\\src\\adapters\\os\\homedir\\os-homedir-adapter.ts',
          kind: 'homedir',
        }),
      ).toBe(true);
    });
  });

  describe('tmpdir-only allowlist', () => {
    it('VALID: {filename: a *.harness.ts file, kind: tmpdir} => returns true', () => {
      expect(
        isOsHomeTmpAllowlistedGuard({
          filename: '/repo/packages/orchestrator/test/orchestration-quest.harness.ts',
          kind: 'tmpdir',
        }),
      ).toBe(true);
    });

    it('VALID: {filename: under test/harnesses/, kind: tmpdir} => returns true', () => {
      expect(
        isOsHomeTmpAllowlistedGuard({
          filename: '/repo/packages/web/test/harnesses/quest/quest-support.ts',
          kind: 'tmpdir',
        }),
      ).toBe(true);
    });

    it('VALID: {filename: a package playwright.config.ts, kind: tmpdir} => returns true', () => {
      expect(
        isOsHomeTmpAllowlistedGuard({
          filename: '/repo/packages/web/playwright.config.ts',
          kind: 'tmpdir',
        }),
      ).toBe(true);
    });
  });

  describe('asymmetry: homedir gets none of the tmpdir-only exceptions', () => {
    it('INVALID: {filename: a *.harness.ts file, kind: homedir} => returns false', () => {
      expect(
        isOsHomeTmpAllowlistedGuard({
          filename: '/repo/packages/orchestrator/test/orchestration-quest.harness.ts',
          kind: 'homedir',
        }),
      ).toBe(false);
    });

    it('INVALID: {filename: under test/harnesses/, kind: homedir} => returns false', () => {
      expect(
        isOsHomeTmpAllowlistedGuard({
          filename: '/repo/packages/web/test/harnesses/quest/quest-support.ts',
          kind: 'homedir',
        }),
      ).toBe(false);
    });

    it('INVALID: {filename: a package playwright.config.ts, kind: homedir} => returns false', () => {
      expect(
        isOsHomeTmpAllowlistedGuard({
          filename: '/repo/packages/web/playwright.config.ts',
          kind: 'homedir',
        }),
      ).toBe(false);
    });
  });

  describe('non-allowlisted production paths', () => {
    it('INVALID: {filename: a regular broker, kind: homedir} => returns false', () => {
      expect(
        isOsHomeTmpAllowlistedGuard({
          filename: '/repo/packages/orchestrator/src/brokers/foo/foo-broker.ts',
          kind: 'homedir',
        }),
      ).toBe(false);
    });

    it('INVALID: {filename: a regular broker, kind: tmpdir} => returns false', () => {
      expect(
        isOsHomeTmpAllowlistedGuard({
          filename: '/repo/packages/orchestrator/src/brokers/foo/foo-broker.ts',
          kind: 'tmpdir',
        }),
      ).toBe(false);
    });
  });
});
