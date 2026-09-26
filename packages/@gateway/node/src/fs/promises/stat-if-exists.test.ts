import { statIfExists } from './stat-if-exists';
import { statIfExistsProxy } from './stat-if-exists.proxy';
import { FsErrorStub } from '../fs-error.stub';

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
      const error = FsErrorStub({ code: 'EACCES' });
      proxy.rejects({ path: '/repo/locked.json', error });

      await expect(statIfExists('/repo/locked.json')).rejects.toBe(error);
    });
  });
});
