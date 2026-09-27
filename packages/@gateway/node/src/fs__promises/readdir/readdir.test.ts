import { readdir } from './readdir';
import { readdirProxy } from './readdir.proxy';
import { FsErrorStub } from '../../fs/is-fs-error/fs-error.stub';

describe('readdir', () => {
  describe('successful reads', () => {
    it('VALID: {path: directory with entries} => returns their names', async () => {
      const proxy = readdirProxy();
      proxy.returns({
        path: '/repo/.dungeonmaster/quests',
        names: ['quest-1.json', 'quest-2.json'],
      });

      const result = await readdir('/repo/.dungeonmaster/quests');

      expect(result).toStrictEqual(['quest-1.json', 'quest-2.json']);
    });
  });

  describe('empty directory', () => {
    it('EMPTY: {path: an empty directory} => returns an empty array', async () => {
      const proxy = readdirProxy();
      proxy.returns({ path: '/repo/.dungeonmaster/quests', names: [] });

      const result = await readdir('/repo/.dungeonmaster/quests');

      expect(result).toStrictEqual([]);
    });
  });

  describe('sad paths', () => {
    it('ERROR: {path: missing} => rejects with the raw ENOENT error', async () => {
      const proxy = readdirProxy();
      proxy.missing({ path: '/repo/missing' });

      await expect(readdir('/repo/missing')).rejects.toStrictEqual(
        FsErrorStub({ code: 'ENOENT', path: '/repo/missing' }),
      );
    });

    it('ERROR: {path: permission denied} => rejects with the raw EACCES error', async () => {
      const proxy = readdirProxy();
      proxy.denied({ path: '/repo/locked' });

      await expect(readdir('/repo/locked')).rejects.toStrictEqual(
        FsErrorStub({ code: 'EACCES', path: '/repo/locked' }),
      );
    });

    it('ERROR: {path: a parent segment that is a file} => rejects with the raw ENOTDIR error', async () => {
      const proxy = readdirProxy();
      proxy.notADirectory({ path: '/repo/.dungeonmaster.json/nested' });

      await expect(readdir('/repo/.dungeonmaster.json/nested')).rejects.toStrictEqual(
        FsErrorStub({ code: 'ENOTDIR', path: '/repo/.dungeonmaster.json/nested' }),
      );
    });
  });

  describe('tolerant addressing', () => {
    it('VALID: {returnsMatchingPath, a predicate} => resolves for a path the predicate accepts', async () => {
      const proxy = readdirProxy();
      proxy.returnsMatchingPath({
        path: (value) => String(value).endsWith('quests'),
        names: ['quest-1.json'],
      });

      const result = await readdir('/resolved/at/runtime/quests');

      expect(result).toStrictEqual(['quest-1.json']);
    });

    it('ERROR: {throwsMatchingPath, a predicate} => rejects with the staged error', async () => {
      const proxy = readdirProxy();
      const error = FsErrorStub({ code: 'ENOENT', path: '/resolved/at/runtime/missing' });
      proxy.throwsMatchingPath({
        path: (value) => String(value).endsWith('missing'),
        error,
      });

      await expect(readdir('/resolved/at/runtime/missing')).rejects.toStrictEqual(error);
    });
  });

  describe('call inspection', () => {
    it('VALID: {a real call already made} => getCallsFor reads it back', async () => {
      const proxy = readdirProxy();
      proxy.returns({ path: '/repo/.dungeonmaster/quests', names: ['quest-1.json'] });

      await readdir('/repo/.dungeonmaster/quests');

      expect(proxy.getCallsFor({ path: '/repo/.dungeonmaster/quests' })).toStrictEqual([
        ['/repo/.dungeonmaster/quests'],
      ]);
    });
  });
});
