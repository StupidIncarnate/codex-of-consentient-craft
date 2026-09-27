import { readJsonFile } from './read-json-file';
import { readJsonFileProxy } from './read-json-file.proxy';
import { FsErrorStub } from '../../fs/is-fs-error/fs-error.stub';

describe('readJsonFile', () => {
  describe('successful reads', () => {
    it('VALID: {path: valid JSON file} => returns the parsed value', async () => {
      const proxy = readJsonFileProxy();
      proxy.returnsRaw({ path: '/repo/.dungeonmaster.json', rawContents: '{"port":3737}' });

      const result = await readJsonFile('/repo/.dungeonmaster.json');

      expect(result).toStrictEqual({ port: 3737 });
    });
  });

  describe('invalid content', () => {
    it('INVALID: {path: malformed JSON} => throws a SyntaxError naming the path', async () => {
      const proxy = readJsonFileProxy();
      proxy.returnsRaw({ path: '/repo/.dungeonmaster.json', rawContents: '{not json' });

      await expect(readJsonFile('/repo/.dungeonmaster.json')).rejects.toStrictEqual(
        new SyntaxError('Invalid JSON in /repo/.dungeonmaster.json'),
      );
    });

    it('EMPTY: {path: an empty file} => throws a SyntaxError, because empty is not JSON', async () => {
      const proxy = readJsonFileProxy();
      proxy.returnsRaw({ path: '/repo/.dungeonmaster.json', rawContents: '' });

      await expect(readJsonFile('/repo/.dungeonmaster.json')).rejects.toStrictEqual(
        new SyntaxError('Invalid JSON in /repo/.dungeonmaster.json'),
      );
    });
  });

  describe('sad paths', () => {
    it('ERROR: {path: missing} => rejects with the raw ENOENT error', async () => {
      const proxy = readJsonFileProxy();
      const error = FsErrorStub({ code: 'ENOENT' });
      proxy.rejects({ path: '/repo/missing.json', error });

      await expect(readJsonFile('/repo/missing.json')).rejects.toBe(error);
    });

    it('ERROR: {path: permission denied} => rejects with the raw EACCES error', async () => {
      const proxy = readJsonFileProxy();
      const error = FsErrorStub({ code: 'EACCES' });
      proxy.rejects({ path: '/repo/locked.json', error });

      await expect(readJsonFile('/repo/locked.json')).rejects.toBe(error);
    });

    it('ERROR: {path: a directory} => rejects with the raw EISDIR error', async () => {
      const proxy = readJsonFileProxy();
      const error = FsErrorStub({ code: 'EISDIR' });
      proxy.rejects({ path: '/repo/quests', error });

      await expect(readJsonFile('/repo/quests')).rejects.toBe(error);
    });
  });
});
