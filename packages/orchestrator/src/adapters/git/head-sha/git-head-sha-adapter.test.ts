import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { gitHeadShaAdapter } from './git-head-sha-adapter';
import { gitHeadShaAdapterProxy } from './git-head-sha-adapter.proxy';

describe('gitHeadShaAdapter', () => {
  describe('successful read', () => {
    it('VALID: {git rev-parse HEAD succeeds} => returns trimmed sha', async () => {
      const proxy = gitHeadShaAdapterProxy();
      proxy.setupSuccess({ sha: 'a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1' });

      const result = await gitHeadShaAdapter({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toBe('a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1');
    });

    it('VALID: {cwd} => spawns `git rev-parse HEAD`', async () => {
      const proxy = gitHeadShaAdapterProxy();
      proxy.setupSuccess({ sha: 'a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1' });

      await gitHeadShaAdapter({ cwd: AbsoluteFilePathStub({ value: '/project' }) });

      expect(proxy.getSpawnedArgs()).toStrictEqual(['rev-parse', 'HEAD']);
    });
  });

  describe('failure cases', () => {
    it('ERROR: {git exits non-zero (not a repo / git unavailable)} => returns null', async () => {
      const proxy = gitHeadShaAdapterProxy();
      proxy.setupFailure();

      const result = await gitHeadShaAdapter({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toBe(null);
    });

    it('EMPTY: {exit code 0 but empty stdout} => returns null', async () => {
      const proxy = gitHeadShaAdapterProxy();
      proxy.setupSuccess({ sha: '' });

      const result = await gitHeadShaAdapter({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toBe(null);
    });
  });
});
