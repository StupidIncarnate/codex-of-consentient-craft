import { statIfExists } from './stat-if-exists';
import { statIfExistsProxy } from './stat-if-exists.proxy';
import { FsErrorStub } from '../../fs/is-fs-error/fs-error.stub';

describe('statIfExists', () => {
  describe('successful reads', () => {
    it('VALID: {path: existing} => returns its metadata', async () => {
      const proxy = statIfExistsProxy();
      proxy.returnsFile({
        path: '/repo/.dungeonmaster.json',
        sizeBytes: 128,
        modifiedAtMs: 1700000000000,
      });

      const result = await statIfExists('/repo/.dungeonmaster.json');

      expect(result).toStrictEqual({
        kind: 'file',
        sizeBytes: 128,
        modifiedAtMs: 1700000000000,
      });
    });
  });

  describe('missing path', () => {
    it('EMPTY: {path: missing} => returns null instead of throwing', async () => {
      const proxy = statIfExistsProxy();
      proxy.missing({ path: '/repo/missing.json' });

      const result = await statIfExists('/repo/missing.json');

      expect(result).toBe(null);
    });
  });

  describe('sad paths', () => {
    it('ERROR: {path: permission denied} => rejects with the raw EACCES error', async () => {
      const proxy = statIfExistsProxy();
      proxy.denied({ path: '/repo/locked.json' });

      await expect(statIfExists('/repo/locked.json')).rejects.toStrictEqual(
        FsErrorStub({ code: 'EACCES', path: '/repo/locked.json' }),
      );
    });
  });

  describe('tolerant addressing', () => {
    it('VALID: {returnsMatchingPath, a predicate} => resolves for a path the predicate accepts', async () => {
      const proxy = statIfExistsProxy();
      proxy.returnsMatchingPath({
        path: (value) => String(value).endsWith('.dungeonmaster.json'),
        kind: 'file',
        sizeBytes: 128,
        modifiedAtMs: 1700000000000,
      });

      const result = await statIfExists('/resolved/at/runtime/.dungeonmaster.json');

      expect(result).toStrictEqual({ kind: 'file', sizeBytes: 128, modifiedAtMs: 1700000000000 });
    });

    it('ERROR: {throwsMatchingPath, a predicate} => rejects with the staged error', async () => {
      const proxy = statIfExistsProxy();
      const error = FsErrorStub({ code: 'EACCES', path: '/resolved/at/runtime/locked.json' });
      proxy.throwsMatchingPath({
        path: (value) => String(value).endsWith('locked.json'),
        error,
      });

      await expect(statIfExists('/resolved/at/runtime/locked.json')).rejects.toStrictEqual(error);
    });
  });

  describe('call inspection', () => {
    it('VALID: {a real call already made} => getCallsFor reads it back', async () => {
      const proxy = statIfExistsProxy();
      proxy.returnsFile({
        path: '/repo/.dungeonmaster.json',
        sizeBytes: 128,
        modifiedAtMs: 1700000000000,
      });

      await statIfExists('/repo/.dungeonmaster.json');

      expect(proxy.getCallsFor({ path: '/repo/.dungeonmaster.json' })).toStrictEqual([
        ['/repo/.dungeonmaster.json'],
      ]);
    });
  });
});
