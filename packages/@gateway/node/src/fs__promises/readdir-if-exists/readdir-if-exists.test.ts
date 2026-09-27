import { readdirIfExists } from './readdir-if-exists';
import { readdirIfExistsProxy } from './readdir-if-exists.proxy';
import { FsErrorStub } from '../../fs/is-fs-error/fs-error.stub';

describe('readdirIfExists', () => {
  describe('successful reads', () => {
    it('VALID: {path: directory with entries} => returns their names', async () => {
      const proxy = readdirIfExistsProxy();
      proxy.returns({ path: '/repo/.dungeonmaster/quests', names: ['quest-1.json'] });

      const result = await readdirIfExists('/repo/.dungeonmaster/quests');

      expect(result).toStrictEqual(['quest-1.json']);
    });

    it('EMPTY: {path: an existing but empty directory} => returns an empty array, not null', async () => {
      const proxy = readdirIfExistsProxy();
      proxy.returns({ path: '/repo/.dungeonmaster/quests', names: [] });

      const result = await readdirIfExists('/repo/.dungeonmaster/quests');

      expect(result).toStrictEqual([]);
    });
  });

  describe('missing directory', () => {
    it('EMPTY: {path: missing} => returns null, distinct from an empty array', async () => {
      const proxy = readdirIfExistsProxy();
      proxy.missing({ path: '/repo/missing' });

      const result = await readdirIfExists('/repo/missing');

      expect(result).toBe(null);
    });
  });

  describe('sad paths', () => {
    it('ERROR: {path: permission denied} => rejects with the raw EACCES error', async () => {
      const proxy = readdirIfExistsProxy();
      proxy.denied({ path: '/repo/locked' });

      await expect(readdirIfExists('/repo/locked')).rejects.toStrictEqual(
        FsErrorStub({ code: 'EACCES', path: '/repo/locked' }),
      );
    });

    it('ERROR: {path: a parent segment that is a file} => rejects with the raw ENOTDIR error', async () => {
      const proxy = readdirIfExistsProxy();
      proxy.notADirectory({ path: '/repo/.dungeonmaster.json/nested' });

      await expect(readdirIfExists('/repo/.dungeonmaster.json/nested')).rejects.toStrictEqual(
        FsErrorStub({ code: 'ENOTDIR', path: '/repo/.dungeonmaster.json/nested' }),
      );
    });
  });

  describe('tolerant addressing', () => {
    it('VALID: {returnsMatchingPath, a predicate} => resolves for a path the predicate accepts', async () => {
      const proxy = readdirIfExistsProxy();
      proxy.returnsMatchingPath({
        path: (value) => String(value).endsWith('quests'),
        names: ['quest-1.json'],
      });

      const result = await readdirIfExists('/resolved/at/runtime/quests');

      expect(result).toStrictEqual(['quest-1.json']);
    });

    it('ERROR: {throwsMatchingPath, a predicate} => rejects with the staged error', async () => {
      const proxy = readdirIfExistsProxy();
      const error = FsErrorStub({ code: 'EACCES', path: '/resolved/at/runtime/locked' });
      proxy.throwsMatchingPath({
        path: (value) => String(value).endsWith('locked'),
        error,
      });

      await expect(readdirIfExists('/resolved/at/runtime/locked')).rejects.toStrictEqual(error);
    });
  });

  describe('call inspection', () => {
    it('VALID: {a real call already made} => getCallsFor reads it back', async () => {
      const proxy = readdirIfExistsProxy();
      proxy.returns({ path: '/repo/.dungeonmaster/quests', names: ['quest-1.json'] });

      await readdirIfExists('/repo/.dungeonmaster/quests');

      expect(proxy.getCallsFor({ path: '/repo/.dungeonmaster/quests' })).toStrictEqual([
        ['/repo/.dungeonmaster/quests'],
      ]);
    });
  });
});
