import { readJsonFileIfExists } from './read-json-file-if-exists';
import { readJsonFileIfExistsProxy } from './read-json-file-if-exists.proxy';
import { FsErrorStub } from '../fs-error.stub';

describe('readJsonFileIfExists', () => {
  describe('successful reads', () => {
    it('VALID: {path: valid JSON file} => returns the parsed value', async () => {
      const proxy = readJsonFileIfExistsProxy();
      proxy.returnsRaw({ path: '/repo/.dungeonmaster.json', rawContents: '{"port":3737}' });

      const result = await readJsonFileIfExists('/repo/.dungeonmaster.json');

      expect(result).toStrictEqual({ port: 3737 });
    });
  });

  describe('missing path', () => {
    it('EMPTY: {path: missing} => returns null instead of throwing', async () => {
      const proxy = readJsonFileIfExistsProxy();
      proxy.missing({ path: '/repo/missing.json' });

      const result = await readJsonFileIfExists('/repo/missing.json');

      expect(result).toBe(null);
    });
  });

  describe('invalid content', () => {
    it('INVALID: {path: malformed JSON} => throws a SyntaxError naming the path', async () => {
      const proxy = readJsonFileIfExistsProxy();
      proxy.returnsRaw({ path: '/repo/.dungeonmaster.json', rawContents: '{not json' });

      await expect(readJsonFileIfExists('/repo/.dungeonmaster.json')).rejects.toStrictEqual(
        new SyntaxError('Invalid JSON in /repo/.dungeonmaster.json'),
      );
    });

    it('EMPTY: {path: an empty file} => throws a SyntaxError, not null', async () => {
      const proxy = readJsonFileIfExistsProxy();
      proxy.returnsRaw({ path: '/repo/.dungeonmaster.json', rawContents: '' });

      await expect(readJsonFileIfExists('/repo/.dungeonmaster.json')).rejects.toStrictEqual(
        new SyntaxError('Invalid JSON in /repo/.dungeonmaster.json'),
      );
    });
  });

  describe('sad paths', () => {
    it('ERROR: {path: permission denied} => rejects with the raw EACCES error', async () => {
      const proxy = readJsonFileIfExistsProxy();
      const error = FsErrorStub({ code: 'EACCES' });
      proxy.rejects({ path: '/repo/locked.json', error });

      await expect(readJsonFileIfExists('/repo/locked.json')).rejects.toBe(error);
    });
  });
});
