import { isQuestFolderGuard } from './is-quest-folder-guard';

describe('isQuestFolderGuard', () => {
  describe('valid quest folders', () => {
    it('VALID: {folderName: "001-add-auth"} => returns true', () => {
      const result = isQuestFolderGuard({ folderName: '001-add-auth' });

      expect(result).toBe(true);
    });

    it('VALID: {folderName: "042-implement-feature"} => returns true', () => {
      const result = isQuestFolderGuard({ folderName: '042-implement-feature' });

      expect(result).toBe(true);
    });

    it('VALID: {folderName: "999-last-quest"} => returns true', () => {
      const result = isQuestFolderGuard({ folderName: '999-last-quest' });

      expect(result).toBe(true);
    });
  });

  describe('invalid quest folders', () => {
    it('INVALID_FOLDER: {folderName: "quest-1.json"} => returns false (not a folder pattern)', () => {
      const result = isQuestFolderGuard({ folderName: 'quest-1.json' });

      expect(result).toBe(false);
    });

    it('INVALID_FOLDER: {folderName: "README.md"} => returns false', () => {
      const result = isQuestFolderGuard({ folderName: 'README.md' });

      expect(result).toBe(false);
    });

    it('INVALID_FOLDER: {folderName: "closed"} => returns false (reserved folder)', () => {
      const result = isQuestFolderGuard({ folderName: 'closed' });

      expect(result).toBe(false);
    });

    it('INVALID_FOLDER: {folderName: "01-too-short"} => returns false (needs 3 digits)', () => {
      const result = isQuestFolderGuard({ folderName: '01-too-short' });

      expect(result).toBe(false);
    });

    it('INVALID_FOLDER: {folderName: "1234-too-long"} => returns false (needs exactly 3 digits)', () => {
      const result = isQuestFolderGuard({ folderName: '1234-too-long' });

      expect(result).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {folderName: undefined} => returns false', () => {
      const result = isQuestFolderGuard({});

      expect(result).toBe(false);
    });

    it('EMPTY: {folderName: ""} => returns false', () => {
      const result = isQuestFolderGuard({ folderName: '' });

      expect(result).toBe(false);
    });
  });
});
