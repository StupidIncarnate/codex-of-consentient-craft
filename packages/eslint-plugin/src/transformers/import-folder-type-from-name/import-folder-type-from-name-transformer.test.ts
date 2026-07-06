import { importFolderTypeFromNameTransformer } from './import-folder-type-from-name-transformer';

describe('importFolderTypeFromNameTransformer', () => {
  describe('matches an export-name suffix', () => {
    it('VALID: {importName: "filePathContract"} => returns "contracts"', () => {
      expect(importFolderTypeFromNameTransformer({ importName: 'filePathContract' })).toBe(
        'contracts',
      );
    });

    it('VALID: {importName: "userFetchBroker"} => returns "brokers"', () => {
      expect(importFolderTypeFromNameTransformer({ importName: 'userFetchBroker' })).toBe(
        'brokers',
      );
    });

    it('VALID: {importName: "isAdminGuard"} => returns "guards"', () => {
      expect(importFolderTypeFromNameTransformer({ importName: 'isAdminGuard' })).toBe('guards');
    });

    it('VALID: {importName: "UserCardWidget"} => returns "widgets"', () => {
      expect(importFolderTypeFromNameTransformer({ importName: 'UserCardWidget' })).toBe('widgets');
    });

    it('VALID: {importName: "NetworkError"} => returns "errors"', () => {
      expect(importFolderTypeFromNameTransformer({ importName: 'NetworkError' })).toBe('errors');
    });

    it('EDGE: {importName: "configStatics"} => returns "statics" not "state"', () => {
      expect(importFolderTypeFromNameTransformer({ importName: 'configStatics' })).toBe('statics');
    });

    it('EDGE: {importName: "userCacheState"} => returns "state" not "statics"', () => {
      expect(importFolderTypeFromNameTransformer({ importName: 'userCacheState' })).toBe('state');
    });
  });

  describe('no folder export-suffix matches', () => {
    it('EMPTY: {importName: "BaseNameStub"} => returns null', () => {
      expect(importFolderTypeFromNameTransformer({ importName: 'BaseNameStub' })).toBe(null);
    });

    it('EMPTY: {importName: "z"} => returns null', () => {
      expect(importFolderTypeFromNameTransformer({ importName: 'z' })).toBe(null);
    });
  });
});
