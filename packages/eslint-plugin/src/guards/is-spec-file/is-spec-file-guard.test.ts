import { isSpecFileGuard } from './is-spec-file-guard';

describe('isSpecFileGuard', () => {
  describe('spec files', () => {
    it('VALID: {filename: "smoke.spec.ts"} => returns true', () => {
      const result = isSpecFileGuard({ filename: 'smoke.spec.ts' });

      expect(result).toBe(true);
    });

    it('VALID: {filename: "/project/e2e/web/guild-creation.spec.ts"} => returns true', () => {
      const result = isSpecFileGuard({
        filename: '/project/e2e/web/guild-creation.spec.ts',
      });

      expect(result).toBe(true);
    });
  });

  describe('non-spec files', () => {
    it('VALID: {filename: "guild-broker.test.ts"} => returns false', () => {
      const result = isSpecFileGuard({ filename: 'guild-broker.test.ts' });

      expect(result).toBe(false);
    });

    it('VALID: {filename: "guild.harness.ts"} => returns false', () => {
      const result = isSpecFileGuard({ filename: 'guild.harness.ts' });

      expect(result).toBe(false);
    });

    it('VALID: {filename: "guild-broker.integration.test.ts"} => returns false', () => {
      const result = isSpecFileGuard({ filename: 'guild-broker.integration.test.ts' });

      expect(result).toBe(false);
    });

    it('VALID: {filename: "guild-broker.ts"} => returns false', () => {
      const result = isSpecFileGuard({ filename: 'guild-broker.ts' });

      expect(result).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('EMPTY: {filename: undefined} => returns false', () => {
      const result = isSpecFileGuard({ filename: undefined });

      expect(result).toBe(false);
    });
  });
});
