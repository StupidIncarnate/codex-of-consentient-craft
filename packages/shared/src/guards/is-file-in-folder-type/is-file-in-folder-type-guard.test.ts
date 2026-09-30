import { isFileInFolderTypeGuard } from './is-file-in-folder-type-guard';

describe('isFileInFolderTypeGuard', () => {
  describe('matching folder type', () => {
    it('VALID: {flows file in flows/ folder} => returns true', () => {
      const filePath = '/repo/packages/server/src/flows/quest/quest-flow.ts';
      const packageSrcPath = '/repo/packages/server/src';

      expect(isFileInFolderTypeGuard({ filePath, packageSrcPath, folderType: 'flows' })).toBe(true);
    });

    it('VALID: {responder file in responders/ folder} => returns true', () => {
      const filePath = '/repo/packages/server/src/responders/quest/start/quest-start-responder.ts';
      const packageSrcPath = '/repo/packages/server/src';

      expect(isFileInFolderTypeGuard({ filePath, packageSrcPath, folderType: 'responders' })).toBe(
        true,
      );
    });
  });

  describe('non-matching folder type', () => {
    it('VALID: {flows file checked against responders} => returns false', () => {
      const filePath = '/repo/packages/server/src/flows/quest/quest-flow.ts';
      const packageSrcPath = '/repo/packages/server/src';

      expect(isFileInFolderTypeGuard({ filePath, packageSrcPath, folderType: 'responders' })).toBe(
        false,
      );
    });
  });

  describe('edge cases', () => {
    it('EMPTY: {filePath undefined} => returns false', () => {
      const packageSrcPath = '/repo/packages/server/src';

      expect(isFileInFolderTypeGuard({ packageSrcPath, folderType: 'flows' })).toBe(false);
    });

    it('EMPTY: {packageSrcPath undefined} => returns false', () => {
      const filePath = '/repo/packages/server/src/flows/quest/quest-flow.ts';

      expect(isFileInFolderTypeGuard({ filePath, folderType: 'flows' })).toBe(false);
    });

    it('EMPTY: {folderType undefined} => returns false', () => {
      const filePath = '/repo/packages/server/src/flows/quest/quest-flow.ts';
      const packageSrcPath = '/repo/packages/server/src';

      expect(isFileInFolderTypeGuard({ filePath, packageSrcPath })).toBe(false);
    });
  });
});
