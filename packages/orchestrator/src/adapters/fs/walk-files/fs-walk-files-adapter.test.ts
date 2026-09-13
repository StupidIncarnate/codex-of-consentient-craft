import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { fsWalkFilesAdapter } from './fs-walk-files-adapter';
import { fsWalkFilesAdapterProxy } from './fs-walk-files-adapter.proxy';

const ROOT = AbsoluteFilePathStub({ value: '/home/user/.claude/projects' });
const PROJ = AbsoluteFilePathStub({ value: '/home/user/.claude/projects/-home-user-proj' });

describe('fsWalkFilesAdapter', () => {
  describe('finding files', () => {
    it('VALID: {one dir with one matching file} => returns it with its mtime and size', () => {
      const proxy = fsWalkFilesAdapterProxy();
      proxy.setupDirectory({ dirPath: ROOT, files: ['a.jsonl'] });
      proxy.setupFileStat({
        filePath: AbsoluteFilePathStub({ value: '/home/user/.claude/projects/a.jsonl' }),
        mtimeMs: 1_789_274_969_242,
        size: 4_096,
      });

      const result = fsWalkFilesAdapter({ rootPath: ROOT, suffix: '.jsonl' });

      expect(result).toStrictEqual([
        {
          path: '/home/user/.claude/projects/a.jsonl',
          mtimeMs: 1_789_274_969_242,
          size: 4_096,
        },
      ]);
    });

    it('VALID: {a nested directory} => descends into it', () => {
      const proxy = fsWalkFilesAdapterProxy();
      proxy.setupDirectory({ dirPath: ROOT, files: [], dirs: ['-home-user-proj'] });
      proxy.setupDirectory({ dirPath: PROJ, files: ['session.jsonl'] });
      proxy.setupFileStat({
        filePath: AbsoluteFilePathStub({
          value: '/home/user/.claude/projects/-home-user-proj/session.jsonl',
        }),
        mtimeMs: 1_789_274_969_242,
        size: 128,
      });

      const result = fsWalkFilesAdapter({ rootPath: ROOT, suffix: '.jsonl' });

      expect(result).toStrictEqual([
        {
          path: '/home/user/.claude/projects/-home-user-proj/session.jsonl',
          mtimeMs: 1_789_274_969_242,
          size: 128,
        },
      ]);
    });

    it('VALID: {a file with another suffix} => is skipped', () => {
      const proxy = fsWalkFilesAdapterProxy();
      proxy.setupDirectory({ dirPath: ROOT, files: ['notes.md'] });

      expect(fsWalkFilesAdapter({ rootPath: ROOT, suffix: '.jsonl' })).toStrictEqual([]);
    });
  });

  describe('surviving a broken tree', () => {
    it('ERROR: {the root cannot be read} => returns empty rather than throwing', () => {
      const proxy = fsWalkFilesAdapterProxy();
      proxy.setupUnreadableDirectory({ dirPath: ROOT });

      expect(fsWalkFilesAdapter({ rootPath: ROOT, suffix: '.jsonl' })).toStrictEqual([]);
    });

    it('ERROR: {one subdirectory is unreadable} => still returns the files it could reach', () => {
      const proxy = fsWalkFilesAdapterProxy();
      proxy.setupDirectory({ dirPath: ROOT, files: ['a.jsonl'], dirs: ['-home-user-proj'] });
      proxy.setupUnreadableDirectory({ dirPath: PROJ });
      proxy.setupFileStat({
        filePath: AbsoluteFilePathStub({ value: '/home/user/.claude/projects/a.jsonl' }),
        mtimeMs: 1,
        size: 2,
      });

      const result = fsWalkFilesAdapter({ rootPath: ROOT, suffix: '.jsonl' });

      expect(result).toStrictEqual([
        { path: '/home/user/.claude/projects/a.jsonl', mtimeMs: 1, size: 2 },
      ]);
    });

    it('ERROR: {a file vanishes between readdir and stat} => is skipped, not thrown', () => {
      const proxy = fsWalkFilesAdapterProxy();
      proxy.setupDirectory({ dirPath: ROOT, files: ['gone.jsonl', 'kept.jsonl'] });
      proxy.setupMissingFileStat({
        filePath: AbsoluteFilePathStub({ value: '/home/user/.claude/projects/gone.jsonl' }),
      });
      proxy.setupFileStat({
        filePath: AbsoluteFilePathStub({ value: '/home/user/.claude/projects/kept.jsonl' }),
        mtimeMs: 5,
        size: 6,
      });

      const result = fsWalkFilesAdapter({ rootPath: ROOT, suffix: '.jsonl' });

      expect(result).toStrictEqual([
        { path: '/home/user/.claude/projects/kept.jsonl', mtimeMs: 5, size: 6 },
      ]);
    });
  });
});
