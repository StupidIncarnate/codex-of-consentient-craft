import { folderConfigStatics } from '@dungeonmaster/shared/statics';

import { isEntryFileGuard } from './is-entry-file-guard';

describe('isEntryFileGuard', () => {
  describe('entry files', () => {
    it('VALID: {broker file path} => returns true', () => {
      const result = isEntryFileGuard({
        filePath: 'src/brokers/auth/login/auth-login-broker.ts',
        folderConfigs: folderConfigStatics,
      });

      expect(result).toBe(true);
    });

    it('VALID: {guard file path} => returns true', () => {
      const result = isEntryFileGuard({
        filePath: 'src/guards/is-valid/is-valid-guard.ts',
        folderConfigs: folderConfigStatics,
      });

      expect(result).toBe(true);
    });

    it('VALID: {transformer file path} => returns true', () => {
      const result = isEntryFileGuard({
        filePath: 'src/transformers/format-date/format-date-transformer.ts',
        folderConfigs: folderConfigStatics,
      });

      expect(result).toBe(true);
    });

    it('VALID: {contract file path} => returns true', () => {
      const result = isEntryFileGuard({
        filePath: 'src/contracts/user/user-contract.ts',
        folderConfigs: folderConfigStatics,
      });

      expect(result).toBe(true);
    });

    it('VALID: {widget tsx file path} => returns true', () => {
      const result = isEntryFileGuard({
        filePath: 'src/widgets/user-profile/user-profile-widget.tsx',
        folderConfigs: folderConfigStatics,
      });

      expect(result).toBe(true);
    });
  });

  describe('non-entry files', () => {
    it('VALID: {test file} => returns false', () => {
      const result = isEntryFileGuard({
        filePath: 'src/brokers/auth/login/auth-login-broker.test.ts',
        folderConfigs: folderConfigStatics,
      });

      expect(result).toBe(false);
    });

    it('VALID: {helper file without suffix} => returns false', () => {
      const result = isEntryFileGuard({
        filePath: 'src/brokers/auth/login/validate-helper.ts',
        folderConfigs: folderConfigStatics,
      });

      expect(result).toBe(false);
    });

    it('VALID: {layer file} => returns false', () => {
      const result = isEntryFileGuard({
        filePath: 'src/brokers/auth/login/auth-login-layer-broker.ts',
        folderConfigs: folderConfigStatics,
      });

      expect(result).toBe(false);
    });

    it('VALID: {proxy file} => returns false', () => {
      const result = isEntryFileGuard({
        filePath: 'src/brokers/auth/login/auth-login-broker.proxy.ts',
        folderConfigs: folderConfigStatics,
      });

      expect(result).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {filePath: undefined} => returns false', () => {
      const result = isEntryFileGuard({ folderConfigs: folderConfigStatics });

      expect(result).toBe(false);
    });

    it('EMPTY: {folderConfigs: undefined} => returns false', () => {
      const result = isEntryFileGuard({ filePath: 'src/brokers/auth/login/auth-login-broker.ts' });

      expect(result).toBe(false);
    });

    it('EMPTY: {both undefined} => returns false', () => {
      const result = isEntryFileGuard({});

      expect(result).toBe(false);
    });
  });
});
