import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { ErrorEntryStub } from '../../contracts/error-entry/error-entry.stub';
import { ProjectFolderStub } from '../../contracts/project-folder/project-folder.stub';
import { toCwdRelativePathTransformer } from './to-cwd-relative-path-transformer';

describe('toCwdRelativePathTransformer', () => {
  describe('absolute paths', () => {
    it('VALID: {cwd matches path prefix} => strips cwd prefix', () => {
      const result = toCwdRelativePathTransformer({
        filePath: ErrorEntryStub({ filePath: '/repo/packages/cli/src/file.ts' }).filePath,
        projectPath: ProjectFolderStub({ path: '/repo/packages/cli' }).path,
        cwd: AbsoluteFilePathStub({ value: '/repo/packages/cli' }),
      });

      expect(String(result)).toBe('src/file.ts');
    });

    it('VALID: {cwd is repo root, path is in sub-package} => returns package-relative path', () => {
      const result = toCwdRelativePathTransformer({
        filePath: ErrorEntryStub({ filePath: '/repo/packages/cli/src/file.ts' }).filePath,
        projectPath: ProjectFolderStub({ path: '/repo/packages/cli' }).path,
        cwd: AbsoluteFilePathStub({ value: '/repo' }),
      });

      expect(String(result)).toBe('packages/cli/src/file.ts');
    });

    it('VALID: {cwd does not match path} => returns absolute path unchanged', () => {
      const result = toCwdRelativePathTransformer({
        filePath: ErrorEntryStub({ filePath: '/other/path/file.ts' }).filePath,
        projectPath: ProjectFolderStub({ path: '/repo/packages/cli' }).path,
        cwd: AbsoluteFilePathStub({ value: '/repo' }),
      });

      expect(String(result)).toBe('/other/path/file.ts');
    });
  });

  describe('relative paths', () => {
    it('VALID: {relative path, cwd matches project} => keeps relative', () => {
      const result = toCwdRelativePathTransformer({
        filePath: ErrorEntryStub({ filePath: 'src/file.ts' }).filePath,
        projectPath: ProjectFolderStub({ path: '/repo/packages/cli' }).path,
        cwd: AbsoluteFilePathStub({ value: '/repo/packages/cli' }),
      });

      expect(String(result)).toBe('src/file.ts');
    });

    it('VALID: {relative path, cwd is repo root} => prepends package path segment', () => {
      const result = toCwdRelativePathTransformer({
        filePath: ErrorEntryStub({ filePath: 'src/file.ts' }).filePath,
        projectPath: ProjectFolderStub({ path: '/repo/packages/cli' }).path,
        cwd: AbsoluteFilePathStub({ value: '/repo' }),
      });

      expect(String(result)).toBe('packages/cli/src/file.ts');
    });
  });
});
