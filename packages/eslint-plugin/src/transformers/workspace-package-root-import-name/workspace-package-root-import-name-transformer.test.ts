import { PathSegmentStub } from '@dungeonmaster/shared/contracts';
import { workspacePackageRootImportNameTransformer } from './workspace-package-root-import-name-transformer';

describe('workspacePackageRootImportNameTransformer', () => {
  it("VALID: {importPath: this repo's own scope, workspaceScope: same} => returns the package name", () => {
    const result = workspacePackageRootImportNameTransformer({
      importPath: '@dungeonmaster/orchestrator',
      workspaceScope: '@dungeonmaster',
    });

    expect(result).toStrictEqual(PathSegmentStub({ value: 'orchestrator' }));
  });

  it("VALID: {importPath: a consumer's own scope, workspaceScope: same} => returns the package name", () => {
    const result = workspacePackageRootImportNameTransformer({
      importPath: '@acme/orders',
      workspaceScope: '@acme',
    });

    expect(result).toStrictEqual(PathSegmentStub({ value: 'orders' }));
  });

  it('EMPTY: {importPath: a different scope than workspaceScope} => returns undefined', () => {
    const result = workspacePackageRootImportNameTransformer({
      importPath: '@dungeonmaster/orchestrator',
      workspaceScope: '@acme',
    });

    expect(result).toBe(undefined);
  });

  it('EMPTY: {importPath: a 3-segment scoped subpath import} => returns undefined, not a bare root form', () => {
    const result = workspacePackageRootImportNameTransformer({
      importPath: '@dungeonmaster/shared/contracts',
      workspaceScope: '@dungeonmaster',
    });

    expect(result).toBe(undefined);
  });

  it('EMPTY: {workspaceScope: undefined} => returns undefined', () => {
    const result = workspacePackageRootImportNameTransformer({
      importPath: '@dungeonmaster/orchestrator',
      workspaceScope: undefined,
    });

    expect(result).toBe(undefined);
  });

  it('EMPTY: {importPath: undefined} => returns undefined', () => {
    const result = workspacePackageRootImportNameTransformer({
      importPath: undefined,
      workspaceScope: '@dungeonmaster',
    });

    expect(result).toBe(undefined);
  });
});
