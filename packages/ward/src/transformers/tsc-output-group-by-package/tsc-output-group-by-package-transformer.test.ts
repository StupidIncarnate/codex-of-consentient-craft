import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { ErrorEntryStub } from '../../contracts/error-entry/error-entry.stub';
import { ProjectFolderStub } from '../../contracts/project-folder/project-folder.stub';
import { tscOutputGroupByPackageTransformer } from './tsc-output-group-by-package-transformer';

describe('tscOutputGroupByPackageTransformer', () => {
  describe('absolute error paths', () => {
    it('VALID: {error in package shared, folders include shared and orchestrator} => groups under shared', () => {
      const sharedFolder = ProjectFolderStub({ path: '/repo/packages/shared' });
      const orchFolder = ProjectFolderStub({
        name: 'orchestrator',
        path: '/repo/packages/orchestrator',
      });
      const err = ErrorEntryStub({ filePath: '/repo/packages/shared/src/contracts/foo.ts' });

      const { byPackage, unmatched } = tscOutputGroupByPackageTransformer({
        errors: [err],
        projectFolders: [sharedFolder, orchFolder],
        rootPath: AbsoluteFilePathStub({ value: '/repo' }),
      });

      expect(byPackage.get(sharedFolder.path)).toStrictEqual([err]);
      expect(byPackage.get(orchFolder.path)).toStrictEqual([]);
      expect(unmatched).toStrictEqual([]);
    });

    it('VALID: {error path outside any package} => goes to unmatched', () => {
      const sharedFolder = ProjectFolderStub({ path: '/repo/packages/shared' });
      const err = ErrorEntryStub({ filePath: '/some/other/path/file.ts' });

      const { byPackage, unmatched } = tscOutputGroupByPackageTransformer({
        errors: [err],
        projectFolders: [sharedFolder],
        rootPath: AbsoluteFilePathStub({ value: '/repo' }),
      });

      expect(byPackage.get(sharedFolder.path)).toStrictEqual([]);
      expect(unmatched).toStrictEqual([err]);
    });

    it('VALID: {nested package shadows parent} => longest path wins', () => {
      const outer = ProjectFolderStub({ name: 'outer', path: '/repo/packages' });
      const inner = ProjectFolderStub({ name: 'inner', path: '/repo/packages/shared' });
      const err = ErrorEntryStub({ filePath: '/repo/packages/shared/src/x.ts' });

      const { byPackage } = tscOutputGroupByPackageTransformer({
        errors: [err],
        projectFolders: [outer, inner],
        rootPath: AbsoluteFilePathStub({ value: '/repo' }),
      });

      expect(byPackage.get(inner.path)).toStrictEqual([err]);
      expect(byPackage.get(outer.path)).toStrictEqual([]);
    });
  });

  describe('relative error paths', () => {
    it('VALID: {relative path resolves under rootPath} => groups under matching package', () => {
      const sharedFolder = ProjectFolderStub({ path: '/repo/packages/shared' });
      const err = ErrorEntryStub({ filePath: 'packages/shared/src/index.ts' });

      const { byPackage, unmatched } = tscOutputGroupByPackageTransformer({
        errors: [err],
        projectFolders: [sharedFolder],
        rootPath: AbsoluteFilePathStub({ value: '/repo' }),
      });

      expect(byPackage.get(sharedFolder.path)).toStrictEqual([err]);
      expect(unmatched).toStrictEqual([]);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {errors: []} => returns empty buckets and no unmatched', () => {
      const sharedFolder = ProjectFolderStub({ path: '/repo/packages/shared' });

      const { byPackage, unmatched } = tscOutputGroupByPackageTransformer({
        errors: [],
        projectFolders: [sharedFolder],
        rootPath: AbsoluteFilePathStub({ value: '/repo' }),
      });

      expect(byPackage.get(sharedFolder.path)).toStrictEqual([]);
      expect(unmatched).toStrictEqual([]);
    });

    it('EMPTY: {projectFolders: []} => all errors go to unmatched', () => {
      const err = ErrorEntryStub({ filePath: '/repo/x.ts' });

      const { byPackage, unmatched } = tscOutputGroupByPackageTransformer({
        errors: [err],
        projectFolders: [],
        rootPath: AbsoluteFilePathStub({ value: '/repo' }),
      });

      expect(byPackage.size).toBe(0);
      expect(unmatched).toStrictEqual([err]);
    });
  });
});
