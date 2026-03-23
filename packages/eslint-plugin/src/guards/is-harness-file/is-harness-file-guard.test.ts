import { isHarnessFileGuard } from './is-harness-file-guard';

describe('isHarnessFileGuard', () => {
  describe('harness files', () => {
    it('VALID: {filename: "guild.harness.ts"} => returns true', () => {
      const result = isHarnessFileGuard({ filename: 'guild.harness.ts' });

      expect(result).toBe(true);
    });

    it('VALID: {filename: "/project/test/harnesses/guild/guild.harness.ts"} => returns true', () => {
      const result = isHarnessFileGuard({
        filename: '/project/test/harnesses/guild/guild.harness.ts',
      });

      expect(result).toBe(true);
    });

    it('VALID: {filename: "claude-mock.harness.ts"} => returns true', () => {
      const result = isHarnessFileGuard({ filename: 'claude-mock.harness.ts' });

      expect(result).toBe(true);
    });
  });

  describe('non-harness files', () => {
    it('VALID: {filename: "guild-broker.ts"} => returns false', () => {
      const result = isHarnessFileGuard({ filename: 'guild-broker.ts' });

      expect(result).toBe(false);
    });

    it('VALID: {filename: "guild-broker.proxy.ts"} => returns false', () => {
      const result = isHarnessFileGuard({ filename: 'guild-broker.proxy.ts' });

      expect(result).toBe(false);
    });

    it('VALID: {filename: "guild-broker.test.ts"} => returns false', () => {
      const result = isHarnessFileGuard({ filename: 'guild-broker.test.ts' });

      expect(result).toBe(false);
    });

    it('VALID: {filename: "smoke.spec.ts"} => returns false', () => {
      const result = isHarnessFileGuard({ filename: 'smoke.spec.ts' });

      expect(result).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('EMPTY: {filename: undefined} => returns false', () => {
      const result = isHarnessFileGuard({ filename: undefined });

      expect(result).toBe(false);
    });
  });
});
