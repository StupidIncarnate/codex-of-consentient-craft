import { repoFileReadIfExistsBroker } from './repo-file-read-if-exists-broker';
import { repoFileReadIfExistsBrokerProxy } from './repo-file-read-if-exists-broker.proxy';

describe('repoFileReadIfExistsBroker', () => {
  describe('existing file', () => {
    it('VALID: {path: existing file} => returns its contents', async () => {
      const proxy = repoFileReadIfExistsBrokerProxy();
      proxy.returns({ path: '/repo/.dungeonmaster.json', contents: '{"port":3737}' });

      const result = await repoFileReadIfExistsBroker({ path: '/repo/.dungeonmaster.json' });

      expect(result).toBe('{"port":3737}');
    });
  });

  describe('missing file', () => {
    it('EMPTY: {path: missing} => returns null instead of throwing', async () => {
      const proxy = repoFileReadIfExistsBrokerProxy();
      proxy.missing({ path: '/repo/missing.json' });

      const result = await repoFileReadIfExistsBroker({ path: '/repo/missing.json' });

      expect(result).toBe(null);
    });
  });
});
