import { isDungeonmasterToolkitImportGuard } from './is-dungeonmaster-toolkit-import-guard';

describe('isDungeonmasterToolkitImportGuard', () => {
  it('VALID: {importSource: a shared subpath} => returns true', () => {
    const result = isDungeonmasterToolkitImportGuard({
      importSource: '@dungeonmaster/shared/contracts',
    });

    expect(result).toBe(true);
  });

  it('VALID: {importSource: the testing register-mock subpath} => returns true', () => {
    const result = isDungeonmasterToolkitImportGuard({
      importSource: '@dungeonmaster/testing/register-mock',
    });

    expect(result).toBe(true);
  });

  it('VALID: {importSource: a package whose name only starts with a gateway folder name} => returns true', () => {
    const result = isDungeonmasterToolkitImportGuard({
      importSource: '@dungeonmaster/node-helpers',
    });

    expect(result).toBe(true);
  });

  it('INVALID: {importSource: dungeonmaster node gateway subpath} => returns false', () => {
    const result = isDungeonmasterToolkitImportGuard({ importSource: '@dungeonmaster/node/fs' });

    expect(result).toBe(false);
  });

  it('INVALID: {importSource: dungeonmaster npm gateway root} => returns false', () => {
    const result = isDungeonmasterToolkitImportGuard({ importSource: '@dungeonmaster/npm' });

    expect(result).toBe(false);
  });

  it('INVALID: {importSource: another scope} => returns false', () => {
    const result = isDungeonmasterToolkitImportGuard({ importSource: '@acme/shared/contracts' });

    expect(result).toBe(false);
  });

  it('INVALID: {importSource: an unscoped npm package} => returns false', () => {
    const result = isDungeonmasterToolkitImportGuard({ importSource: 'zod' });

    expect(result).toBe(false);
  });

  it('EMPTY: {importSource: undefined} => returns false', () => {
    const result = isDungeonmasterToolkitImportGuard({});

    expect(result).toBe(false);
  });
});
