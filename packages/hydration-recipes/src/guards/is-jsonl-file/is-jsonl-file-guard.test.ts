import { isJsonlFileGuard } from './is-jsonl-file-guard';

describe('isJsonlFileGuard', () => {
  describe('a jsonl file', () => {
    it('VALID: {filename: "seed-session-1.jsonl"} => returns true', () => {
      expect(isJsonlFileGuard({ filename: 'seed-session-1.jsonl' })).toBe(true);
    });
  });

  describe('a non-jsonl file', () => {
    it('INVALID: {filename: "notes.txt"} => returns false', () => {
      expect(isJsonlFileGuard({ filename: 'notes.txt' })).toBe(false);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {} => returns false', () => {
      expect(isJsonlFileGuard({})).toBe(false);
    });
  });
});
