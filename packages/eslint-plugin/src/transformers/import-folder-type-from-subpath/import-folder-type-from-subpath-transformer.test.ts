import { importFolderTypeFromSubpathTransformer } from './import-folder-type-from-subpath-transformer';

describe('importFolderTypeFromSubpathTransformer', () => {
  describe('subpath names a folder type', () => {
    it('VALID: {importPath: "@dungeonmaster/shared/contracts"} => returns "contracts"', () => {
      expect(
        importFolderTypeFromSubpathTransformer({ importPath: '@dungeonmaster/shared/contracts' }),
      ).toBe('contracts');
    });

    it('VALID: {importPath: "@acme/domain/adapters/http"} => returns "adapters"', () => {
      expect(
        importFolderTypeFromSubpathTransformer({ importPath: '@acme/domain/adapters/http' }),
      ).toBe('adapters');
    });

    it('VALID: {importPath: "core/flows"} => returns "flows"', () => {
      expect(importFolderTypeFromSubpathTransformer({ importPath: 'core/flows' })).toBe('flows');
    });
  });

  describe('no folder-type segment', () => {
    it('EMPTY: {importPath: "@dungeonmaster/orchestrator"} => returns null', () => {
      expect(
        importFolderTypeFromSubpathTransformer({ importPath: '@dungeonmaster/orchestrator' }),
      ).toBe(null);
    });

    it('EMPTY: {importPath: "react"} => returns null', () => {
      expect(importFolderTypeFromSubpathTransformer({ importPath: 'react' })).toBe(null);
    });
  });
});
