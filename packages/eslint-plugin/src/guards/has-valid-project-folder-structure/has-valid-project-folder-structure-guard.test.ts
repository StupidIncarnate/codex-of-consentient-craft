import { forbiddenFolders } from '../../transformers/forbidden-folder-suggestion/forbidden-folder-suggestion-transformer';
import { folderConfigStatics } from '../../statics/folder-config/folder-config-statics';
import { hasValidProjectFolderStructureGuard } from './has-valid-project-folder-structure-guard';

const allowedFolders = Object.keys(folderConfigStatics);

describe('hasValidProjectFolderStructureGuard', () => {
  describe('valid project folder structure', () => {
    it('VALID: brokers file at depth 2 with correct suffix => returns true', () => {
      expect(
        hasValidProjectFolderStructureGuard({
          filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
          firstFolder: 'brokers',
          forbiddenFolders,
          allowedFolders,
        }),
      ).toBe(true);
    });

    it('VALID: contracts file at depth 1 with correct suffix => returns true', () => {
      expect(
        hasValidProjectFolderStructureGuard({
          filename: '/project/src/contracts/user/user-contract.ts',
          firstFolder: 'contracts',
          forbiddenFolders,
          allowedFolders,
        }),
      ).toBe(true);
    });

    it('VALID: guards file at depth 1 with correct suffix => returns true', () => {
      expect(
        hasValidProjectFolderStructureGuard({
          filename: '/project/src/guards/auth/auth-guard.ts',
          firstFolder: 'guards',
          forbiddenFolders,
          allowedFolders,
        }),
      ).toBe(true);
    });
  });

  describe('forbidden folders', () => {
    it('INVALID: utils folder (forbidden) => returns false', () => {
      expect(
        hasValidProjectFolderStructureGuard({
          filename: '/project/src/utils/format-date.ts',
          firstFolder: 'utils',
          forbiddenFolders,
          allowedFolders,
        }),
      ).toBe(false);
    });

    it('INVALID: lib folder (forbidden) => returns false', () => {
      expect(
        hasValidProjectFolderStructureGuard({
          filename: '/project/src/lib/api-client.ts',
          firstFolder: 'lib',
          forbiddenFolders,
          allowedFolders,
        }),
      ).toBe(false);
    });
  });

  describe('unknown folders', () => {
    it('INVALID: unknown folder not in allowed list => returns false', () => {
      expect(
        hasValidProjectFolderStructureGuard({
          filename: '/project/src/unknown/file.ts',
          firstFolder: 'unknown',
          forbiddenFolders,
          allowedFolders,
        }),
      ).toBe(false);
    });
  });

  describe('wrong folder depth', () => {
    it('INVALID: brokers file at depth 0 (should be 2) => returns false', () => {
      expect(
        hasValidProjectFolderStructureGuard({
          filename: '/project/src/brokers/user-fetch-broker.ts',
          firstFolder: 'brokers',
          forbiddenFolders,
          allowedFolders,
        }),
      ).toBe(false);
    });

    it('INVALID: contracts file at depth 2 (should be 1) => returns false', () => {
      expect(
        hasValidProjectFolderStructureGuard({
          filename: '/project/src/contracts/user/model/user-contract.ts',
          firstFolder: 'contracts',
          forbiddenFolders,
          allowedFolders,
        }),
      ).toBe(false);
    });
  });

  describe('wrong file suffix', () => {
    it('INVALID: brokers file without -broker.ts suffix => returns false', () => {
      expect(
        hasValidProjectFolderStructureGuard({
          filename: '/project/src/brokers/user/fetch/user-fetch.ts',
          firstFolder: 'brokers',
          forbiddenFolders,
          allowedFolders,
        }),
      ).toBe(false);
    });

    it('INVALID: contracts file without -contract.ts suffix => returns false', () => {
      expect(
        hasValidProjectFolderStructureGuard({
          filename: '/project/src/contracts/user/user.ts',
          firstFolder: 'contracts',
          forbiddenFolders,
          allowedFolders,
        }),
      ).toBe(false);
    });
  });
});
