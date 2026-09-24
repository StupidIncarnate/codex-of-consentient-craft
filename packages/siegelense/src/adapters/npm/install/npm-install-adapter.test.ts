import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { npmInstallAdapter } from './npm-install-adapter';
import { npmInstallAdapterProxy } from './npm-install-adapter.proxy';

const CWD = AbsoluteFilePathStub({ value: '/project' });

describe('npmInstallAdapter', () => {
  describe('success', () => {
    it('VALID: {cwd} => spawns `npm install` from that repo root', async () => {
      const proxy = npmInstallAdapterProxy();
      proxy.setupSuccess();

      await npmInstallAdapter({ cwd: CWD });

      expect({ args: proxy.getSpawnedArgs(), cwd: proxy.getSpawnedCwd() }).toStrictEqual({
        args: ['install'],
        cwd: '/project',
      });
    });

    it('VALID: {npm install succeeds} => returns exit code 0', async () => {
      const proxy = npmInstallAdapterProxy();
      proxy.setupSuccess();

      const result = await npmInstallAdapter({ cwd: CWD });

      expect(result.exitCode).toBe(0);
    });
  });

  describe('failure', () => {
    it('ERROR: {npm install exits non-zero} => returns the exit code and output rather than throwing', async () => {
      const proxy = npmInstallAdapterProxy();
      proxy.setupFailure({ output: 'npm ERR! network request failed' });

      const result = await npmInstallAdapter({ cwd: CWD });

      expect({ exitCode: result.exitCode, output: String(result.output) }).toStrictEqual({
        exitCode: 1,
        output: 'npm ERR! network request failed',
      });
    });
  });
});
