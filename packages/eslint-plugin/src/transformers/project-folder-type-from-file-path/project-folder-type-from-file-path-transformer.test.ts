import { projectFolderTypeFromFilePathTransformer } from './project-folder-type-from-file-path-transformer';

describe('projectFolderTypeFromFilePathTransformer', () => {
  describe('valid paths with /src/ and subfolders', () => {
    it('VALID: {filename: "/project/src/brokers/user/fetch.ts"} => returns "brokers"', () => {
      expect(
        projectFolderTypeFromFilePathTransformer({
          filename: '/project/src/brokers/user/fetch.ts',
        }),
      ).toBe('brokers');
    });

    it('VALID: {filename: "/project/src/contracts/user.ts"} => returns "contracts"', () => {
      expect(
        projectFolderTypeFromFilePathTransformer({ filename: '/project/src/contracts/user.ts' }),
      ).toBe('contracts');
    });

    it('VALID: {filename: "/project/src/guards/auth/auth-guard.ts"} => returns "guards"', () => {
      expect(
        projectFolderTypeFromFilePathTransformer({
          filename: '/project/src/guards/auth/auth-guard.ts',
        }),
      ).toBe('guards');
    });

    it('VALID: {filename: "/a/b/c/src/widgets/button.tsx"} => returns "widgets"', () => {
      expect(
        projectFolderTypeFromFilePathTransformer({ filename: '/a/b/c/src/widgets/button.tsx' }),
      ).toBe('widgets');
    });

    it('VALID: {filename: "/project/src/transformers/user/user-transformer.ts"} => returns "transformers"', () => {
      expect(
        projectFolderTypeFromFilePathTransformer({
          filename: '/project/src/transformers/user/user-transformer.ts',
        }),
      ).toBe('transformers');
    });
  });

  describe('files directly in /src/ (no subfolders)', () => {
    it('NULL: {filename: "/project/src/index.ts"} => returns null', () => {
      expect(projectFolderTypeFromFilePathTransformer({ filename: '/project/src/index.ts' })).toBe(
        null,
      );
    });

    it('NULL: {filename: "/project/src/main.ts"} => returns null', () => {
      expect(projectFolderTypeFromFilePathTransformer({ filename: '/project/src/main.ts' })).toBe(
        null,
      );
    });
  });

  describe('files not in /src/', () => {
    it('NULL: {filename: "/project/lib/utils.ts"} => returns null', () => {
      expect(projectFolderTypeFromFilePathTransformer({ filename: '/project/lib/utils.ts' })).toBe(
        null,
      );
    });

    it('NULL: {filename: "/project/test/helper.ts"} => returns null', () => {
      expect(
        projectFolderTypeFromFilePathTransformer({ filename: '/project/test/helper.ts' }),
      ).toBe(null);
    });

    it('NULL: {filename: "utils.ts"} => returns null', () => {
      expect(projectFolderTypeFromFilePathTransformer({ filename: 'utils.ts' })).toBe(null);
    });
  });

  describe('edge cases', () => {
    it('NULL: {filename: "/project/src/"} => returns null', () => {
      expect(projectFolderTypeFromFilePathTransformer({ filename: '/project/src/' })).toBe(null);
    });

    it('NULL: {filename: ""} => returns null', () => {
      expect(projectFolderTypeFromFilePathTransformer({ filename: '' })).toBe(null);
    });
  });
});
