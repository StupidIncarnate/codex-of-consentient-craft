import { isE2eTestPathGuard } from './is-e2e-test-path-guard';

describe('isE2eTestPathGuard', () => {
  describe('valid e2e paths', () => {
    it('VALID: {packages/web/src/flows/home/guild-delete.e2e.ts} => returns true', () => {
      const result = isE2eTestPathGuard({
        filePath: 'packages/web/src/flows/home/guild-delete.e2e.ts',
      });

      expect(result).toBe(true);
    });

    it('VALID: {smoke.e2e.ts} => returns true', () => {
      const result = isE2eTestPathGuard({ filePath: 'smoke.e2e.ts' });

      expect(result).toBe(true);
    });

    it('VALID: {packages/web/src/flows/quest-chat/chat-features.e2e.ts} => returns true', () => {
      const result = isE2eTestPathGuard({
        filePath: 'packages/web/src/flows/quest-chat/chat-features.e2e.ts',
      });

      expect(result).toBe(true);
    });
  });

  describe('non-e2e paths', () => {
    it('INVALID: {unit test file} => returns false', () => {
      const result = isE2eTestPathGuard({ filePath: 'src/foo.test.ts' });

      expect(result).toBe(false);
    });

    it('INVALID: {integration test file} => returns false', () => {
      const result = isE2eTestPathGuard({ filePath: 'src/foo.integration.test.ts' });

      expect(result).toBe(false);
    });

    it('INVALID: {source file} => returns false', () => {
      const result = isE2eTestPathGuard({ filePath: 'src/brokers/user/user-broker.ts' });

      expect(result).toBe(false);
    });

    it('INVALID: {foo.e2e.test.ts} => returns false', () => {
      const result = isE2eTestPathGuard({ filePath: 'src/foo.e2e.test.ts' });

      expect(result).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {filePath: undefined} => returns false', () => {
      const result = isE2eTestPathGuard({});

      expect(result).toBe(false);
    });
  });
});
