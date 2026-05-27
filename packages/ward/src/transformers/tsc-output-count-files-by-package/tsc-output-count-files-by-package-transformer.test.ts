import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { ProjectFolderStub } from '../../contracts/project-folder/project-folder.stub';

import { tscOutputCountFilesByPackageTransformer } from './tsc-output-count-files-by-package-transformer';

describe('tscOutputCountFilesByPackageTransformer', () => {
  describe('empty output', () => {
    it('EMPTY: {output: empty string} => all packages get count 0', () => {
      const shared = ProjectFolderStub({ name: 'shared', path: '/repo/packages/shared' });
      const web = ProjectFolderStub({ name: 'web', path: '/repo/packages/web' });

      const counts = tscOutputCountFilesByPackageTransformer({
        output: '',
        projectFolders: [shared, web],
        rootPath: AbsoluteFilePathStub({ value: '/repo' }),
      });

      expect(counts.get(shared.path)).toBe(0);
      expect(counts.get(web.path)).toBe(0);
    });
  });

  describe('empty projectFolders', () => {
    it('EMPTY: {projectFolders: []} => returns empty map', () => {
      const counts = tscOutputCountFilesByPackageTransformer({
        output: '/repo/packages/shared/src/index.ts',
        projectFolders: [],
        rootPath: AbsoluteFilePathStub({ value: '/repo' }),
      });

      expect(counts.size).toBe(0);
    });
  });

  describe('single package', () => {
    it('VALID: {3 listFiles lines for shared} => shared gets count 3', () => {
      const shared = ProjectFolderStub({ name: 'shared', path: '/repo/packages/shared' });

      const output = [
        '/repo/packages/shared/src/index.ts',
        '/repo/packages/shared/src/contracts/user/user-contract.ts',
        '/repo/packages/shared/src/guards/is-string/is-string-guard.ts',
      ].join('\n');

      const counts = tscOutputCountFilesByPackageTransformer({
        output,
        projectFolders: [shared],
        rootPath: AbsoluteFilePathStub({ value: '/repo' }),
      });

      expect(counts.get(shared.path)).toBe(3);
    });
  });

  describe('multiple packages', () => {
    it('VALID: {lines split between shared and web} => each package gets correct count', () => {
      const shared = ProjectFolderStub({ name: 'shared', path: '/repo/packages/shared' });
      const web = ProjectFolderStub({ name: 'web', path: '/repo/packages/web' });

      const output = [
        '/repo/packages/shared/src/index.ts',
        '/repo/packages/shared/src/contracts/user.ts',
        '/repo/packages/web/src/app.ts',
        '/repo/packages/web/src/components/button.ts',
        '/repo/packages/web/src/components/input.ts',
      ].join('\n');

      const counts = tscOutputCountFilesByPackageTransformer({
        output,
        projectFolders: [shared, web],
        rootPath: AbsoluteFilePathStub({ value: '/repo' }),
      });

      expect(counts.get(shared.path)).toBe(2);
      expect(counts.get(web.path)).toBe(3);
    });
  });

  describe('node_modules filtering', () => {
    it('VALID: {lines containing node_modules} => excluded from counts', () => {
      const shared = ProjectFolderStub({ name: 'shared', path: '/repo/packages/shared' });

      const output = [
        '/repo/packages/shared/node_modules/typescript/lib/lib.es5.d.ts',
        '/repo/packages/shared/src/index.ts',
        '/repo/node_modules/zod/dist/index.d.ts',
      ].join('\n');

      const counts = tscOutputCountFilesByPackageTransformer({
        output,
        projectFolders: [shared],
        rootPath: AbsoluteFilePathStub({ value: '/repo' }),
      });

      expect(counts.get(shared.path)).toBe(1);
    });
  });

  describe('outside-root lines', () => {
    it('VALID: {line outside rootPath} => not counted for any package', () => {
      const shared = ProjectFolderStub({ name: 'shared', path: '/repo/packages/shared' });

      const output = [
        '/other-repo/packages/shared/src/index.ts',
        '/repo/packages/shared/src/index.ts',
      ].join('\n');

      const counts = tscOutputCountFilesByPackageTransformer({
        output,
        projectFolders: [shared],
        rootPath: AbsoluteFilePathStub({ value: '/repo' }),
      });

      expect(counts.get(shared.path)).toBe(1);
    });
  });

  describe('relative lines ignored', () => {
    it('VALID: {lines not starting with /} => skipped', () => {
      const shared = ProjectFolderStub({ name: 'shared', path: '/repo/packages/shared' });

      const output = ['packages/shared/src/index.ts', '/repo/packages/shared/src/app.ts'].join(
        '\n',
      );

      const counts = tscOutputCountFilesByPackageTransformer({
        output,
        projectFolders: [shared],
        rootPath: AbsoluteFilePathStub({ value: '/repo' }),
      });

      expect(counts.get(shared.path)).toBe(1);
    });
  });

  describe('no matching package', () => {
    it('VALID: {line outside any package folder} => package counts unchanged at 0', () => {
      const shared = ProjectFolderStub({ name: 'shared', path: '/repo/packages/shared' });

      const counts = tscOutputCountFilesByPackageTransformer({
        output: '/repo/packages/other/src/index.ts',
        projectFolders: [shared],
        rootPath: AbsoluteFilePathStub({ value: '/repo' }),
      });

      expect(counts.get(shared.path)).toBe(0);
    });
  });
});
