import { stat } from './stat';
import { statProxy } from './stat.proxy';
import { FsErrorStub } from '../../fs/is-fs-error/fs-error.stub';

describe('stat', () => {
  describe('successful reads', () => {
    it('VALID: {path: a regular file} => returns kind file with size and mtime', async () => {
      const proxy = statProxy();
      proxy.returnsFile({
        path: '/repo/.dungeonmaster.json',
        sizeBytes: 128,
        modifiedAtMs: 1700000000000,
      });

      const result = await stat('/repo/.dungeonmaster.json');

      expect(result).toStrictEqual({
        kind: 'file',
        sizeBytes: 128,
        modifiedAtMs: 1700000000000,
      });
    });

    it('VALID: {path: a directory} => returns kind directory', async () => {
      const proxy = statProxy();
      proxy.returnsDirectory({
        path: '/repo/.dungeonmaster',
        sizeBytes: 4096,
        modifiedAtMs: 1700000000000,
      });

      const result = await stat('/repo/.dungeonmaster');

      expect(result).toStrictEqual({
        kind: 'directory',
        sizeBytes: 4096,
        modifiedAtMs: 1700000000000,
      });
    });

    it('VALID: {path: a symlink target reported as a symlink} => returns kind symlink', async () => {
      const proxy = statProxy();
      proxy.returnsSymlink({
        path: '/repo/node_modules/@dungeonmaster/orchestrator',
        sizeBytes: 0,
        modifiedAtMs: 1700000000000,
      });

      const result = await stat('/repo/node_modules/@dungeonmaster/orchestrator');

      expect(result).toStrictEqual({
        kind: 'symlink',
        sizeBytes: 0,
        modifiedAtMs: 1700000000000,
      });
    });

    it('EDGE: {path: mtimeMs with sub-millisecond precision} => floors it to an integer', async () => {
      const proxy = statProxy();
      proxy.returnsFile({
        path: '/repo/.dungeonmaster.json',
        sizeBytes: 128,
        modifiedAtMs: 1700000000000.75,
      });

      const result = await stat('/repo/.dungeonmaster.json');

      expect(result.modifiedAtMs).toBe(1700000000000);
    });
  });

  describe('sad paths', () => {
    it('ERROR: {path: missing} => rejects with the raw ENOENT error', async () => {
      const proxy = statProxy();
      proxy.missing({ path: '/repo/missing.json' });

      await expect(stat('/repo/missing.json')).rejects.toStrictEqual(
        FsErrorStub({ code: 'ENOENT', path: '/repo/missing.json' }),
      );
    });

    it('ERROR: {path: permission denied} => rejects with the raw EACCES error', async () => {
      const proxy = statProxy();
      proxy.denied({ path: '/repo/locked.json' });

      await expect(stat('/repo/locked.json')).rejects.toStrictEqual(
        FsErrorStub({ code: 'EACCES', path: '/repo/locked.json' }),
      );
    });
  });

  describe('tolerant addressing', () => {
    it('VALID: {returnsMatchingPath, a predicate} => resolves for a path the predicate accepts', async () => {
      const proxy = statProxy();
      proxy.returnsMatchingPath({
        path: (value) => String(value).endsWith('.dungeonmaster.json'),
        kind: 'file',
        sizeBytes: 128,
        modifiedAtMs: 1700000000000,
      });

      const result = await stat('/resolved/at/runtime/.dungeonmaster.json');

      expect(result).toStrictEqual({ kind: 'file', sizeBytes: 128, modifiedAtMs: 1700000000000 });
    });

    it('ERROR: {throwsMatchingPath, a predicate} => rejects with the staged error', async () => {
      const proxy = statProxy();
      const error = FsErrorStub({ code: 'ENOENT', path: '/resolved/at/runtime/missing.json' });
      proxy.throwsMatchingPath({
        path: (value) => String(value).endsWith('missing.json'),
        error,
      });

      await expect(stat('/resolved/at/runtime/missing.json')).rejects.toStrictEqual(error);
    });
  });

  describe('call inspection', () => {
    it('VALID: {a real call already made} => getCallsFor reads it back', async () => {
      const proxy = statProxy();
      proxy.returnsFile({
        path: '/repo/.dungeonmaster.json',
        sizeBytes: 128,
        modifiedAtMs: 1700000000000,
      });

      await stat('/repo/.dungeonmaster.json');

      expect(proxy.getCallsFor({ path: '/repo/.dungeonmaster.json' })).toStrictEqual([
        ['/repo/.dungeonmaster.json'],
      ]);
    });
  });
});
