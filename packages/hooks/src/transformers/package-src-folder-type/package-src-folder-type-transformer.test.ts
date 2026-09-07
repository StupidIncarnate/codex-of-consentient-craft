import { folderConfigStatics } from '@dungeonmaster/shared/statics';
import { packageSrcFolderTypeTransformer } from './package-src-folder-type-transformer';

const folderTypeKeys = Object.keys(
  folderConfigStatics,
) as readonly (keyof typeof folderConfigStatics)[];

describe('packageSrcFolderTypeTransformer', () => {
  describe('valid paths', () => {
    it('VALID: {filePath: "/home/u/repo/packages/hooks/src/brokers/foo/foo-broker.ts"} => returns "brokers"', () => {
      expect(
        packageSrcFolderTypeTransformer({
          filePath: '/home/u/repo/packages/hooks/src/brokers/foo/foo-broker.ts',
        }),
      ).toBe('brokers');
    });

    it('VALID: {filePath: "packages/shared/src/statics/x/x-statics.ts"} => returns "statics"', () => {
      expect(
        packageSrcFolderTypeTransformer({
          filePath: 'packages/shared/src/statics/x/x-statics.ts',
        }),
      ).toBe('statics');
    });

    it('VALID: {filePath: "packages/hooks/src/contracts/a/a-contract.test.ts"} => returns "contracts"', () => {
      expect(
        packageSrcFolderTypeTransformer({
          filePath: 'packages/hooks/src/contracts/a/a-contract.test.ts',
        }),
      ).toBe('contracts');
    });

    it('VALID: {filePath: "packages/hooks/src/brokers/a/b/c/d/foo-broker.ts"} => returns "brokers" (first segment after src/)', () => {
      expect(
        packageSrcFolderTypeTransformer({
          filePath: 'packages/hooks/src/brokers/a/b/c/d/foo-broker.ts',
        }),
      ).toBe('brokers');
    });

    it('VALID: {filePath: "worktrees/folder-detail-preedit-hook/packages/hooks/src/brokers/foo/foo-broker.ts"} => returns "brokers"', () => {
      expect(
        packageSrcFolderTypeTransformer({
          filePath:
            'worktrees/folder-detail-preedit-hook/packages/hooks/src/brokers/foo/foo-broker.ts',
        }),
      ).toBe('brokers');
    });
  });

  describe('every folder type resolves', () => {
    it.each(folderTypeKeys)(
      'VALID: {filePath: "packages/hooks/src/%s/foo/foo-file.ts"} => returns "%s"',
      (folderType) => {
        expect(
          packageSrcFolderTypeTransformer({
            filePath: `packages/hooks/src/${folderType}/foo/foo-file.ts`,
          }),
        ).toBe(folderType);
      },
    );
  });

  describe('empty input', () => {
    it('EMPTY: {filePath: ""} => returns null', () => {
      expect(packageSrcFolderTypeTransformer({ filePath: '' })).toBe(null);
    });
  });

  describe('invalid paths', () => {
    it('INVALID: {filePath: "packages/hooks/src/utils/x.ts"} => returns null (not a folder-type key)', () => {
      expect(packageSrcFolderTypeTransformer({ filePath: 'packages/hooks/src/utils/x.ts' })).toBe(
        null,
      );
    });

    it('INVALID: {filePath: "packages/hooks/test/harnesses/x.ts"} => returns null (not under src/)', () => {
      expect(
        packageSrcFolderTypeTransformer({ filePath: 'packages/hooks/test/harnesses/x.ts' }),
      ).toBe(null);
    });

    it('INVALID: {filePath: "scripts/build.ts"} => returns null (no packages/<pkg>/src/)', () => {
      expect(packageSrcFolderTypeTransformer({ filePath: 'scripts/build.ts' })).toBe(null);
    });

    it('INVALID: {filePath: "packages/hooks/src/brokers"} => returns null (nothing after the folder type)', () => {
      expect(packageSrcFolderTypeTransformer({ filePath: 'packages/hooks/src/brokers' })).toBe(
        null,
      );
    });

    it('INVALID: {filePath: "src/brokers/foo/foo-broker.ts"} => returns null (no packages/<pkg>/ prefix)', () => {
      expect(packageSrcFolderTypeTransformer({ filePath: 'src/brokers/foo/foo-broker.ts' })).toBe(
        null,
      );
    });
  });

  describe('edge cases', () => {
    it('EDGE: {filePath: "/home/user/archive/packages/old-app/packages/hooks/src/brokers/foo/foo-broker.ts"} => returns "brokers" (resolves against the LAST packages/<pkg>/src/)', () => {
      expect(
        packageSrcFolderTypeTransformer({
          filePath:
            '/home/user/archive/packages/old-app/packages/hooks/src/brokers/foo/foo-broker.ts',
        }),
      ).toBe('brokers');
    });
  });
});
