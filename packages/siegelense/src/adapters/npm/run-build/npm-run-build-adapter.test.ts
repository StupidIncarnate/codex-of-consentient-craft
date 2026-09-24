import { AbsoluteFilePathStub, PackageNameStub } from '@dungeonmaster/shared/contracts';

import { npmRunBuildAdapter } from './npm-run-build-adapter';
import { npmRunBuildAdapterProxy } from './npm-run-build-adapter.proxy';

const CWD = AbsoluteFilePathStub({ value: '/project' });
const WORKSPACE = PackageNameStub({ value: '@dungeonmaster/hydration-recipes' });

describe('npmRunBuildAdapter', () => {
  describe('success', () => {
    it('VALID: {cwd, workspace} => spawns `npm run build --workspace=<name>` from that repo root', async () => {
      const proxy = npmRunBuildAdapterProxy();
      proxy.setupSuccess();

      await npmRunBuildAdapter({ cwd: CWD, workspace: WORKSPACE });

      expect({ args: proxy.getSpawnedArgs(), cwd: proxy.getSpawnedCwd() }).toStrictEqual({
        args: ['run', 'build', '--workspace=@dungeonmaster/hydration-recipes'],
        cwd: '/project',
      });
    });

    it('VALID: {npm run build succeeds} => returns exit code 0', async () => {
      const proxy = npmRunBuildAdapterProxy();
      proxy.setupSuccess();

      const result = await npmRunBuildAdapter({ cwd: CWD, workspace: WORKSPACE });

      expect(result.exitCode).toBe(0);
    });
  });

  describe('failure', () => {
    it('ERROR: {npm run build exits non-zero} => returns the exit code and output rather than throwing', async () => {
      const proxy = npmRunBuildAdapterProxy();
      proxy.setupFailure({ output: 'error TS2307: Cannot find module' });

      const result = await npmRunBuildAdapter({ cwd: CWD, workspace: WORKSPACE });

      expect({ exitCode: result.exitCode, output: String(result.output) }).toStrictEqual({
        exitCode: 1,
        output: 'error TS2307: Cannot find module',
      });
    });
  });
});
