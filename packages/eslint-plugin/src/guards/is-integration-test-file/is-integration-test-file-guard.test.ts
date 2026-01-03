import { isIntegrationTestFileGuard } from './is-integration-test-file-guard';
import { FilePathStub } from '@dungeonmaster/shared/contracts';

describe('isIntegrationTestFileGuard', () => {
  describe('integration test files', () => {
    it('VALID: {filePath: .integration.test.ts} => returns true', () => {
      const result = isIntegrationTestFileGuard({
        filePath: FilePathStub({ value: '/project/src/startup/start-cli.integration.test.ts' }),
      });

      expect(result).toBe(true);
    });

    it('VALID: {filePath: .integration.spec.ts} => returns true', () => {
      const result = isIntegrationTestFileGuard({
        filePath: FilePathStub({ value: '/project/src/startup/start-cli.integration.spec.ts' }),
      });

      expect(result).toBe(true);
    });
  });

  describe('non-integration test files', () => {
    it('INVALID: {filePath: .test.ts} => returns false', () => {
      const result = isIntegrationTestFileGuard({
        filePath: FilePathStub({ value: '/project/src/brokers/user/user-broker.test.ts' }),
      });

      expect(result).toBe(false);
    });

    it('INVALID: {filePath: .e2e.test.ts} => returns false', () => {
      const result = isIntegrationTestFileGuard({
        filePath: FilePathStub({ value: '/project/src/tests/login.e2e.test.ts' }),
      });

      expect(result).toBe(false);
    });

    it('INVALID: {filePath: implementation file} => returns false', () => {
      const result = isIntegrationTestFileGuard({
        filePath: FilePathStub({ value: '/project/src/brokers/user/user-broker.ts' }),
      });

      expect(result).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {filePath: undefined} => returns false', () => {
      const result = isIntegrationTestFileGuard({});

      expect(result).toBe(false);
    });
  });
});
