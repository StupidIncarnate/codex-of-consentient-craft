import { walkFilesSync } from './walk-files-sync';
import { walkFilesSyncProxy } from './walk-files-sync.proxy';
import { FsErrorStub } from './fs-error.stub';

const ROOT = '/home/user/.claude/projects';
const PROJ = '/home/user/.claude/projects/-home-user-proj';

describe('walkFilesSync', () => {
  describe('finding files', () => {
    it('VALID: {one dir with one matching file} => returns it with its size and mtime', () => {
      const proxy = walkFilesSyncProxy();
      proxy.setupDirectory({ dirPath: ROOT, files: ['a.jsonl'] });
      proxy.setupFileStat({
        filePath: `${ROOT}/a.jsonl`,
        sizeBytes: 4096,
        modifiedAtMs: 1_789_274_969_242,
      });

      expect(walkFilesSync({ rootPath: ROOT, suffix: '.jsonl' })).toStrictEqual([
        { path: `${ROOT}/a.jsonl`, sizeBytes: 4096, modifiedAtMs: 1_789_274_969_242 },
      ]);
    });

    it('VALID: {a nested directory} => descends into it', () => {
      const proxy = walkFilesSyncProxy();
      proxy.setupDirectory({ dirPath: ROOT, files: [], dirs: ['-home-user-proj'] });
      proxy.setupDirectory({ dirPath: PROJ, files: ['session.jsonl'] });
      proxy.setupFileStat({
        filePath: `${PROJ}/session.jsonl`,
        sizeBytes: 128,
        modifiedAtMs: 1_789_274_969_242,
      });

      expect(walkFilesSync({ rootPath: ROOT, suffix: '.jsonl' })).toStrictEqual([
        { path: `${PROJ}/session.jsonl`, sizeBytes: 128, modifiedAtMs: 1_789_274_969_242 },
      ]);
    });

    it('EMPTY: {a file with another suffix} => is skipped', () => {
      const proxy = walkFilesSyncProxy();
      proxy.setupDirectory({ dirPath: ROOT, files: ['notes.md'] });

      expect(walkFilesSync({ rootPath: ROOT, suffix: '.jsonl' })).toStrictEqual([]);
    });
  });

  describe('surviving a broken tree', () => {
    it('ERROR: {the root cannot be read, EACCES} => returns empty rather than throwing', () => {
      const proxy = walkFilesSyncProxy();
      proxy.setupUnreadableDirectory({
        dirPath: ROOT,
        error: FsErrorStub({ code: 'EACCES', path: ROOT }),
      });

      expect(walkFilesSync({ rootPath: ROOT, suffix: '.jsonl' })).toStrictEqual([]);
    });

    it('ERROR: {one subdirectory is unreadable} => still returns the files it could reach', () => {
      const proxy = walkFilesSyncProxy();
      proxy.setupDirectory({ dirPath: ROOT, files: ['a.jsonl'], dirs: ['-home-user-proj'] });
      proxy.setupUnreadableDirectory({
        dirPath: PROJ,
        error: FsErrorStub({ code: 'EACCES', path: PROJ }),
      });
      proxy.setupFileStat({ filePath: `${ROOT}/a.jsonl`, sizeBytes: 2, modifiedAtMs: 1 });

      expect(walkFilesSync({ rootPath: ROOT, suffix: '.jsonl' })).toStrictEqual([
        { path: `${ROOT}/a.jsonl`, sizeBytes: 2, modifiedAtMs: 1 },
      ]);
    });

    it('ERROR: {a file vanishes between readdir and stat, ENOENT} => is skipped, not thrown', () => {
      const proxy = walkFilesSyncProxy();
      proxy.setupDirectory({ dirPath: ROOT, files: ['gone.jsonl', 'kept.jsonl'] });
      proxy.setupMissingFileStat({
        filePath: `${ROOT}/gone.jsonl`,
        error: FsErrorStub({ code: 'ENOENT', path: `${ROOT}/gone.jsonl` }),
      });
      proxy.setupFileStat({ filePath: `${ROOT}/kept.jsonl`, sizeBytes: 6, modifiedAtMs: 5 });

      expect(walkFilesSync({ rootPath: ROOT, suffix: '.jsonl' })).toStrictEqual([
        { path: `${ROOT}/kept.jsonl`, sizeBytes: 6, modifiedAtMs: 5 },
      ]);
    });

    it('EMPTY: {the root does not exist, ENOENT} => returns an empty array', () => {
      const proxy = walkFilesSyncProxy();
      proxy.setupUnreadableDirectory({
        dirPath: ROOT,
        error: FsErrorStub({ code: 'ENOENT', path: ROOT }),
      });

      expect(walkFilesSync({ rootPath: ROOT, suffix: '.jsonl' })).toStrictEqual([]);
    });
  });
});
