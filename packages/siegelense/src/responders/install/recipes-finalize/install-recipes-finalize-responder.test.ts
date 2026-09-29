import { FilePathStub, InstallContextStub } from '@dungeonmaster/shared/contracts';

import { InstallRecipesFinalizeResponderProxy } from './install-recipes-finalize-responder.proxy';

const CONTEXT = InstallContextStub({
  value: {
    targetProjectRoot: FilePathStub({ value: '/project' }),
    dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
  },
});

describe('InstallRecipesFinalizeResponder', () => {
  describe('nothing scaffolded this run', () => {
    it('VALID: {recipesScaffoldState empty} => skipped, no npm command runs', async () => {
      const proxy = InstallRecipesFinalizeResponderProxy();
      proxy.setupNothingScaffolded();

      const result = await proxy.callResponder({ context: CONTEXT });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: true,
        action: 'skipped',
        message: 'no freshly scaffolded packages/hydration-recipes/ this run',
      });
      expect(proxy.wasNpmSpawned()).toBe(false);
    });
  });

  describe('scaffolded this run, npm install and npm run build both succeed', () => {
    it('VALID: {scaffolded} => npm install runs, then npm run build --workspace=<name>, both from targetProjectRoot', async () => {
      const proxy = InstallRecipesFinalizeResponderProxy();
      proxy.setupScaffolded();

      await proxy.callResponder({ context: CONTEXT });

      expect({
        installArgs: proxy.getInstallSpawnArgs(),
        buildArgs: proxy.getBuildSpawnArgs(),
        installFromCwd: proxy.wasInstallSpawnedFromCwd({ cwd: '/project' }),
        buildFromCwd: proxy.wasBuildSpawnedFromCwd({ cwd: '/project' }),
      }).toStrictEqual({
        installArgs: ['install'],
        buildArgs: ['run', 'build', '--workspace=hydration-recipes'],
        installFromCwd: true,
        buildFromCwd: true,
      });
    });

    it('VALID: {scaffolded} => reports success naming the finished build command', async () => {
      const proxy = InstallRecipesFinalizeResponderProxy();
      proxy.setupScaffolded();

      const result = await proxy.callResponder({ context: CONTEXT });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: true,
        action: 'created',
        message:
          'npm run build --workspace=hydration-recipes finished for packages/hydration-recipes/',
      });
    });

    it('VALID: {scaffolded with a scoped package name} => npm run build targets the scoped workspace', async () => {
      const proxy = InstallRecipesFinalizeResponderProxy();
      proxy.setupScaffolded({ recipesPackageName: '@acme/hydration-recipes' });

      const result = await proxy.callResponder({ context: CONTEXT });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: true,
        action: 'created',
        message:
          'npm run build --workspace=@acme/hydration-recipes finished for packages/hydration-recipes/',
      });
    });
  });

  describe('scaffolded this run, npm install fails', () => {
    it('ERROR: {npm install exits non-zero} => success: false, the message names the failure and the command to run by hand, and build is never attempted', async () => {
      const proxy = InstallRecipesFinalizeResponderProxy();
      proxy.setupScaffolded();
      proxy.setupInstallFails({ output: 'npm ERR! network request failed' });

      const result = await proxy.callResponder({ context: CONTEXT });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: false,
        action: 'created',
        message:
          'npm install failed (exit 1): npm ERR! network request failed — run "npm install" at the repo root, ' +
          'then "npm run build --workspace=hydration-recipes" to finish setting it up',
      });
      expect(proxy.getBuildSpawnArgs()).toBe(undefined);
    });
  });

  describe('scaffolded this run, npm install succeeds but npm run build fails', () => {
    it('ERROR: {npm run build exits non-zero} => success: false, the message names the failure and the exact build command to run by hand', async () => {
      const proxy = InstallRecipesFinalizeResponderProxy();
      proxy.setupScaffolded();
      proxy.setupBuildFails({ output: 'error TS2307: Cannot find module' });

      const result = await proxy.callResponder({ context: CONTEXT });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: false,
        action: 'created',
        message:
          'npm run build --workspace=hydration-recipes failed (exit 1): error TS2307: Cannot find module — run ' +
          '"npm run build --workspace=hydration-recipes" to finish setting it up',
      });
    });
  });

  describe('two calls in the same run', () => {
    it('VALID: {scaffolded, called twice} => the second call is a no-op — the flag drains after the first read', async () => {
      const proxy = InstallRecipesFinalizeResponderProxy();
      proxy.setupScaffolded();

      await proxy.callResponder({ context: CONTEXT });
      const secondResult = await proxy.callResponder({ context: CONTEXT });

      expect(secondResult).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: true,
        action: 'skipped',
        message: 'no freshly scaffolded packages/hydration-recipes/ this run',
      });
    });
  });
});
