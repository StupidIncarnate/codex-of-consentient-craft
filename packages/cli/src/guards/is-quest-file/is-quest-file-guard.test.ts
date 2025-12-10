import { isQuestFileGuard } from './is-quest-file-guard';

describe('isQuestFileGuard', () => {
  describe('valid quest files', () => {
    it('VALID: {filename: "add-auth.json"} => returns true', () => {
      const result = isQuestFileGuard({ filename: 'add-auth.json' });

      expect(result).toBe(true);
    });

    it('VALID: {filename: "001-fix-bug.json"} => returns true', () => {
      const result = isQuestFileGuard({ filename: '001-fix-bug.json' });

      expect(result).toBe(true);
    });

    it('VALID: {filename: ".json"} => returns true', () => {
      const result = isQuestFileGuard({ filename: '.json' });

      expect(result).toBe(true);
    });
  });

  describe('invalid quest files', () => {
    it('INVALID_EXTENSION: {filename: "readme.md"} => returns false', () => {
      const result = isQuestFileGuard({ filename: 'readme.md' });

      expect(result).toBe(false);
    });

    it('INVALID_EXTENSION: {filename: "quest.txt"} => returns false', () => {
      const result = isQuestFileGuard({ filename: 'quest.txt' });

      expect(result).toBe(false);
    });

    it('INVALID_EXTENSION: {filename: "config"} => returns false', () => {
      const result = isQuestFileGuard({ filename: 'config' });

      expect(result).toBe(false);
    });

    it('INVALID_EXTENSION: {filename: "json"} => returns false', () => {
      const result = isQuestFileGuard({ filename: 'json' });

      expect(result).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {filename: undefined} => returns false', () => {
      const result = isQuestFileGuard({});

      expect(result).toBe(false);
    });

    it('EMPTY: {filename: ""} => returns false', () => {
      const result = isQuestFileGuard({ filename: '' });

      expect(result).toBe(false);
    });
  });
});
