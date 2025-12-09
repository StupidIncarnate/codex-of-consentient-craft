import { FolderTypeStub } from '@dungeonmaster/shared/contracts';
import { isEntryFileGuard } from './is-entry-file-guard';

describe('isEntryFileGuard', () => {
  describe('entry files (valid)', () => {
    it('VALID: user-contract.ts is entry file for contracts/', () => {
      const result = isEntryFileGuard({
        filePath: '/project/src/contracts/user/user-contract.ts',
        folderType: FolderTypeStub({ value: 'contracts' }),
      });

      expect(result).toBe(true);
    });

    it('VALID: axios-get-adapter.ts is entry file for adapters/', () => {
      const result = isEntryFileGuard({
        filePath: '/project/src/adapters/axios/get/axios-get-adapter.ts',
        folderType: FolderTypeStub({ value: 'adapters' }),
      });

      expect(result).toBe(true);
    });

    it('VALID: user-fetch-broker.ts is entry file for brokers/', () => {
      const result = isEntryFileGuard({
        filePath: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
        folderType: FolderTypeStub({ value: 'brokers' }),
      });

      expect(result).toBe(true);
    });

    it('VALID: format-date-transformer.ts is entry file for transformers/', () => {
      const result = isEntryFileGuard({
        filePath: '/project/src/transformers/format-date/format-date-transformer.ts',
        folderType: FolderTypeStub({ value: 'transformers' }),
      });

      expect(result).toBe(true);
    });

    it('VALID: has-permission-guard.ts is entry file for guards/', () => {
      const result = isEntryFileGuard({
        filePath: '/project/src/guards/has-permission/has-permission-guard.ts',
        folderType: FolderTypeStub({ value: 'guards' }),
      });

      expect(result).toBe(true);
    });

    it('VALID: api-statics.ts is entry file for statics/', () => {
      const result = isEntryFileGuard({
        filePath: '/project/src/statics/api/api-statics.ts',
        folderType: FolderTypeStub({ value: 'statics' }),
      });

      expect(result).toBe(true);
    });

    it('VALID: validation-error.ts is entry file for errors/', () => {
      const result = isEntryFileGuard({
        filePath: '/project/src/errors/validation/validation-error.ts',
        folderType: FolderTypeStub({ value: 'errors' }),
      });

      expect(result).toBe(true);
    });

    it('VALID: user-widget.tsx is entry file for widgets/ (tsx extension)', () => {
      const result = isEntryFileGuard({
        filePath: '/project/src/widgets/user/user-widget.tsx',
        folderType: FolderTypeStub({ value: 'widgets' }),
      });

      expect(result).toBe(true);
    });
  });

  describe('non-entry files (invalid)', () => {
    it('INVALID: user.stub.ts is not entry file (multi-dot file)', () => {
      const result = isEntryFileGuard({
        filePath: '/project/src/contracts/user/user.stub.ts',
        folderType: FolderTypeStub({ value: 'contracts' }),
      });

      expect(result).toBe(false);
    });

    it('INVALID: user.mock.ts is not entry file (multi-dot file)', () => {
      const result = isEntryFileGuard({
        filePath: '/project/src/adapters/user/user.mock.ts',
        folderType: FolderTypeStub({ value: 'adapters' }),
      });

      expect(result).toBe(false);
    });

    it('INVALID: helper.ts is not entry file for contracts/', () => {
      const result = isEntryFileGuard({
        filePath: '/project/src/contracts/user/helper.ts',
        folderType: FolderTypeStub({ value: 'contracts' }),
      });

      expect(result).toBe(false);
    });

    it('INVALID: utility.ts is not entry file for adapters/', () => {
      const result = isEntryFileGuard({
        filePath: '/project/src/adapters/axios/utility.ts',
        folderType: FolderTypeStub({ value: 'adapters' }),
      });

      expect(result).toBe(false);
    });

    it('INVALID: utils.ts is not entry file for brokers/', () => {
      const result = isEntryFileGuard({
        filePath: '/project/src/brokers/user/fetch/utils.ts',
        folderType: FolderTypeStub({ value: 'brokers' }),
      });

      expect(result).toBe(false);
    });

    it('INVALID: user-fetcher-broker.ts is not entry file (wrong name pattern)', () => {
      const result = isEntryFileGuard({
        filePath: '/project/src/brokers/user/fetch/user-fetcher-broker.ts',
        folderType: FolderTypeStub({ value: 'brokers' }),
      });

      expect(result).toBe(false);
    });

    it('INVALID: test-helper.ts is not entry file for transformers/', () => {
      const result = isEntryFileGuard({
        filePath: '/project/src/transformers/user/test-helper.ts',
        folderType: FolderTypeStub({ value: 'transformers' }),
      });

      expect(result).toBe(false);
    });

    it('INVALID: config.ts is not entry file for statics/ (missing -statics suffix)', () => {
      const result = isEntryFileGuard({
        filePath: '/project/src/statics/config/config.ts',
        folderType: FolderTypeStub({ value: 'statics' }),
      });

      expect(result).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('EDGE: user-contract.test.ts is not entry file (test file)', () => {
      const result = isEntryFileGuard({
        filePath: '/project/src/contracts/user/user-contract.test.ts',
        folderType: FolderTypeStub({ value: 'contracts' }),
      });

      expect(result).toBe(false);
    });

    it('EDGE: filename with path is handled correctly', () => {
      const result = isEntryFileGuard({
        filePath: '/project/src/contracts/user/user-contract.ts',
        folderType: FolderTypeStub({ value: 'contracts' }),
      });

      expect(result).toBe(true);
    });

    it('EDGE: index.ts in startup folder (special case)', () => {
      const result = isEntryFileGuard({
        filePath: '/project/src/startup/index.ts',
        folderType: FolderTypeStub({ value: 'startup' }),
      });

      expect(result).toBe(true);
    });

    it('EDGE: other-file.ts in allowed-import folder is NOT entry file', () => {
      const result = isEntryFileGuard({
        filePath: '/project/src/contracts/allowed-import/other-file.ts',
        folderType: FolderTypeStub({ value: 'contracts' }),
      });

      expect(result).toBe(false);
    });

    it('EDGE: allowed-import-contract.ts in allowed-import folder IS entry file', () => {
      const result = isEntryFileGuard({
        filePath: '/project/src/contracts/allowed-import/allowed-import-contract.ts',
        folderType: FolderTypeStub({ value: 'contracts' }),
      });

      expect(result).toBe(true);
    });
  });

  describe('brokers (depth 2) - comprehensive tests', () => {
    it('VALID: user-create-broker.ts is entry file for brokers/', () => {
      const result = isEntryFileGuard({
        filePath: '/project/src/brokers/user/create/user-create-broker.ts',
        folderType: FolderTypeStub({ value: 'brokers' }),
      });

      expect(result).toBe(true);
    });

    it('VALID: payment-process-broker.ts is entry file for brokers/', () => {
      const result = isEntryFileGuard({
        filePath: '/project/src/brokers/payment/process/payment-process-broker.ts',
        folderType: FolderTypeStub({ value: 'brokers' }),
      });

      expect(result).toBe(true);
    });

    it('VALID: email-send-broker.ts is entry file for brokers/', () => {
      const result = isEntryFileGuard({
        filePath: '/project/src/brokers/email/send/email-send-broker.ts',
        folderType: FolderTypeStub({ value: 'brokers' }),
      });

      expect(result).toBe(true);
    });

    it('INVALID: helper.ts is not entry file for brokers/', () => {
      const result = isEntryFileGuard({
        filePath: '/project/src/brokers/user/fetch/helper.ts',
        folderType: FolderTypeStub({ value: 'brokers' }),
      });

      expect(result).toBe(false);
    });

    it('INVALID: user-utils.ts is not entry file for brokers/', () => {
      const result = isEntryFileGuard({
        filePath: '/project/src/brokers/user/fetch/user-utils.ts',
        folderType: FolderTypeStub({ value: 'brokers' }),
      });

      expect(result).toBe(false);
    });

    it('INVALID: broker.ts is not entry file (missing domain-action prefix)', () => {
      const result = isEntryFileGuard({
        filePath: '/project/src/brokers/user/fetch/broker.ts',
        folderType: FolderTypeStub({ value: 'brokers' }),
      });

      expect(result).toBe(false);
    });

    it('INVALID: user-broker.ts is not entry file (missing action)', () => {
      const result = isEntryFileGuard({
        filePath: '/project/src/brokers/user/fetch/user-broker.ts',
        folderType: FolderTypeStub({ value: 'brokers' }),
      });

      expect(result).toBe(false);
    });

    it('INVALID: user-create.stub.ts is not entry file (multi-dot)', () => {
      const result = isEntryFileGuard({
        filePath: '/project/src/brokers/user/create/user-create.stub.ts',
        folderType: FolderTypeStub({ value: 'brokers' }),
      });

      expect(result).toBe(false);
    });

    it('INVALID: user-fetch-broker.test.ts is not entry file (test file)', () => {
      const result = isEntryFileGuard({
        filePath: '/project/src/brokers/user/fetch/user-fetch-broker.test.ts',
        folderType: FolderTypeStub({ value: 'brokers' }),
      });

      expect(result).toBe(false);
    });

    it('EDGE: broker file with full path is handled correctly', () => {
      const result = isEntryFileGuard({
        filePath: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
        folderType: FolderTypeStub({ value: 'brokers' }),
      });

      expect(result).toBe(true);
    });
  });

  describe('responders (depth 2) - comprehensive tests', () => {
    it('VALID: user-profile-responder.ts is entry file for responders/', () => {
      const result = isEntryFileGuard({
        filePath: '/project/src/responders/user/profile/user-profile-responder.ts',
        folderType: FolderTypeStub({ value: 'responders' }),
      });

      expect(result).toBe(true);
    });

    it('VALID: admin-delete-responder.ts is entry file for responders/', () => {
      const result = isEntryFileGuard({
        filePath: '/project/src/responders/admin/delete/admin-delete-responder.ts',
        folderType: FolderTypeStub({ value: 'responders' }),
      });

      expect(result).toBe(true);
    });

    it('INVALID: utils.ts is not entry file for responders/', () => {
      const result = isEntryFileGuard({
        filePath: '/project/src/responders/user/create/utils.ts',
        folderType: FolderTypeStub({ value: 'responders' }),
      });

      expect(result).toBe(false);
    });

    it('INVALID: responder.ts is not entry file (missing domain-action prefix)', () => {
      const result = isEntryFileGuard({
        filePath: '/project/src/responders/user/create/responder.ts',
        folderType: FolderTypeStub({ value: 'responders' }),
      });

      expect(result).toBe(false);
    });

    it('INVALID: user-create.mock.ts is not entry file (multi-dot)', () => {
      const result = isEntryFileGuard({
        filePath: '/project/src/responders/user/create/user-create.mock.ts',
        folderType: FolderTypeStub({ value: 'responders' }),
      });

      expect(result).toBe(false);
    });
  });
});
