import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { gitVerifyRefAdapter } from './git-verify-ref-adapter';
import { gitVerifyRefAdapterProxy } from './git-verify-ref-adapter.proxy';

describe('gitVerifyRefAdapter', () => {
  describe('ref exists', () => {
    it('VALID: {git rev-parse --verify exits 0} => returns true', async () => {
      const proxy = gitVerifyRefAdapterProxy();
      proxy.setupExists();

      const result = await gitVerifyRefAdapter({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
        ref: 'main',
      });

      expect(result).toBe(true);
    });

    it('VALID: {ref: "main", cwd} => spawns `git rev-parse --verify main` in cwd', async () => {
      const proxy = gitVerifyRefAdapterProxy();
      proxy.setupExists();
      const cwd = AbsoluteFilePathStub({ value: '/project' });

      await gitVerifyRefAdapter({ cwd, ref: 'main' });

      expect(proxy.getSpawnedArgs()).toStrictEqual(['rev-parse', '--verify', 'main']);
      expect(proxy.getSpawnedCwd()).toBe(cwd);
    });
  });

  describe('ref missing', () => {
    it('INVALID: {git rev-parse --verify exits non-zero} => returns false', async () => {
      const proxy = gitVerifyRefAdapterProxy();
      proxy.setupMissing();

      const result = await gitVerifyRefAdapter({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
        ref: 'master',
      });

      expect(result).toBe(false);
    });
  });
});
