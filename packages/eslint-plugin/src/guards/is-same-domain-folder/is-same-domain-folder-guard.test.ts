import { isSameDomainFolderGuard } from './is-same-domain-folder-guard';

describe('isSameDomainFolderGuard', () => {
  describe('same domain folder imports', () => {
    it('VALID: test file importing from implementation in same folder (adapters/fs/)', () => {
      const result = isSameDomainFolderGuard({
        currentFilePath: '/project/src/adapters/fs/fs-exists-sync-adapter.test.ts',
        importPath: './fs-exists-sync-adapter',
      });

      expect(result).toBe(true);
    });

    it('VALID: stub importing from contract in same folder (contracts/user/)', () => {
      const result = isSameDomainFolderGuard({
        currentFilePath: '/project/src/contracts/user/user.stub.ts',
        importPath: './user-contract',
      });

      expect(result).toBe(true);
    });

    it('VALID: helper importing from broker in same folder (brokers/user/fetch/)', () => {
      const result = isSameDomainFolderGuard({
        currentFilePath: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
        importPath: './helper',
      });

      expect(result).toBe(true);
    });

    it('VALID: relative parent then back down to same folder (contracts/user/)', () => {
      const result = isSameDomainFolderGuard({
        currentFilePath: '/project/src/contracts/user/user.stub.ts',
        importPath: '../user/user-contract',
      });

      expect(result).toBe(true);
    });
  });

  describe('different domain folder imports', () => {
    it('INVALID: importing from different domain folder (guards/auth/ -> contracts/user/)', () => {
      const result = isSameDomainFolderGuard({
        currentFilePath: '/project/src/guards/auth/auth-guard.ts',
        importPath: '../../contracts/user/user-contract',
      });

      expect(result).toBe(false);
    });

    it('INVALID: importing from different domain in same category (adapters/fs/ -> adapters/axios/)', () => {
      const result = isSameDomainFolderGuard({
        currentFilePath: '/project/src/adapters/fs/fs-read-adapter.ts',
        importPath: '../axios/axios-get-adapter',
      });

      expect(result).toBe(false);
    });

    it('INVALID: importing from different nested domain (brokers/user/fetch/ -> brokers/user/create/)', () => {
      const result = isSameDomainFolderGuard({
        currentFilePath: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
        importPath: '../create/user-create-broker',
      });

      expect(result).toBe(false);
    });

    it('INVALID: importing from different domain (contracts/user/ -> contracts/company/)', () => {
      const result = isSameDomainFolderGuard({
        currentFilePath: '/project/src/contracts/user/user-contract.ts',
        importPath: '../company/company-contract',
      });

      expect(result).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('EDGE: non-relative import returns false', () => {
      const result = isSameDomainFolderGuard({
        currentFilePath: '/project/src/guards/user/user-guard.ts',
        importPath: 'zod',
      });

      expect(result).toBe(false);
    });

    it('EDGE: absolute path returns false', () => {
      const result = isSameDomainFolderGuard({
        currentFilePath: '/project/src/guards/user/user-guard.ts',
        importPath: '/project/src/contracts/user/user-contract',
      });

      expect(result).toBe(false);
    });

    it('EMPTY: {currentFilePath: undefined} => returns false', () => {
      const result = isSameDomainFolderGuard({
        currentFilePath: undefined,
        importPath: './user-contract',
      });

      expect(result).toBe(false);
    });

    it('EMPTY: {importPath: undefined} => returns false', () => {
      const result = isSameDomainFolderGuard({
        currentFilePath: '/project/src/guards/user/user-guard.ts',
        importPath: undefined,
      });

      expect(result).toBe(false);
    });

    it('EMPTY: {currentFilePath: undefined, importPath: undefined} => returns false', () => {
      const result = isSameDomainFolderGuard({
        currentFilePath: undefined,
        importPath: undefined,
      });

      expect(result).toBe(false);
    });

    it('EMPTY: {} => returns false', () => {
      const result = isSameDomainFolderGuard({});

      expect(result).toBe(false);
    });
  });
});
