import { scannedFileContract } from './scanned-file-contract';
import { ScannedFileStub } from './scanned-file.stub';

describe('scannedFileContract', () => {
  describe('valid input', () => {
    it('VALID: {path, mtimeMs, size} => parses to the complete entry', () => {
      const file = scannedFileContract.parse({
        path: '/home/user/.claude/projects/-home-user-proj/session.jsonl',
        mtimeMs: 1_789_274_969_242,
        size: 4_096,
      });

      expect(file).toStrictEqual({
        path: '/home/user/.claude/projects/-home-user-proj/session.jsonl',
        mtimeMs: 1_789_274_969_242,
        size: 4_096,
      });
    });

    it('EMPTY: {size: 0} => parses, which is a transcript a session has not written to yet', () => {
      expect(ScannedFileStub({ size: 0 }).size).toBe(0);
    });
  });

  describe('invalid input', () => {
    it('INVALID: {path: relative} => throws, because the walk yields absolute paths only', () => {
      expect(() => ScannedFileStub({ path: 'projects/session.jsonl' as never })).toThrow(
        /absolute/iu,
      );
    });

    it('INVALID: {size: -1} => throws', () => {
      expect(() => ScannedFileStub({ size: -1 as never })).toThrow(/greater than or equal to 0/u);
    });
  });
});
