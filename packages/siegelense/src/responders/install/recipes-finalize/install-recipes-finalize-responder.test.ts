import { InstallContextStub } from '@dungeonmaster/shared/contracts/install-context/install-context.stub';

import { InstallRecipesFinalizeResponderProxy } from './install-recipes-finalize-responder.proxy';

const CONTEXT = InstallContextStub({
  value: {
    targetProjectRoot: '/project',
    dungeonmasterRoot: '/dm-root',
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
    it("ERROR: {npm install exits 1 with an E404} => success: false, error names the command, cwd, exit code, npm's first error line and the commands to run by hand; build is never attempted", async () => {
      const proxy = InstallRecipesFinalizeResponderProxy();
      proxy.setupScaffolded();
      proxy.setupInstallFails({
        output: [
          'npm error code E404',
          'npm error 404 Not Found - GET https://registry.npmjs.org/@dungeonmaster%2fsiegelense - Not found',
          "npm error 404  '@dungeonmaster/siegelense@*' is not in this registry.",
        ].join('\n'),
      });

      const result = await proxy.callResponder({ context: CONTEXT });

      expect({ result, buildArgs: proxy.getBuildSpawnArgs() }).toStrictEqual({
        result: {
          packageName: '@dungeonmaster/siegelense',
          success: false,
          action: 'failed',
          error:
            '"npm install" in /project exited 1: npm error 404 Not Found - GET ' +
            'https://registry.npmjs.org/@dungeonmaster%2fsiegelense - Not found — ' +
            'packages/hydration-recipes/ is scaffolded but not built; fix that, then run "npm install" ' +
            'at the repo root and "npm run build --workspace=hydration-recipes" by hand',
        },
        buildArgs: undefined,
      });
    });

    it('ERROR: {npm install exits 1 with no output} => error says npm printed nothing rather than ending on an empty colon', async () => {
      const proxy = InstallRecipesFinalizeResponderProxy();
      proxy.setupScaffolded();
      proxy.setupInstallFails({ output: '' });

      const result = await proxy.callResponder({ context: CONTEXT });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: false,
        action: 'failed',
        error:
          '"npm install" in /project exited 1: (npm printed no output) — ' +
          'packages/hydration-recipes/ is scaffolded but not built; fix that, then run "npm install" ' +
          'at the repo root and "npm run build --workspace=hydration-recipes" by hand',
      });
    });
  });

  describe('scaffolded this run, npm install succeeds but npm run build fails', () => {
    it('ERROR: {npm run build exits 1} => success: false, error names the build command, exit code, the first error line and the build command to run by hand', async () => {
      const proxy = InstallRecipesFinalizeResponderProxy();
      proxy.setupScaffolded();
      proxy.setupBuildFails({
        output:
          '> hydration-recipes@0.0.0 build\n> tsc -p tsconfig.build.json\n' +
          "src/index.ts(1,20): error TS2307: Cannot find module 'x'.\nnpm error code 2",
      });

      const result = await proxy.callResponder({ context: CONTEXT });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: false,
        action: 'failed',
        error:
          '"npm run build --workspace=hydration-recipes" in /project exited 1: ' +
          "src/index.ts(1,20): error TS2307: Cannot find module 'x'. — " +
          'packages/hydration-recipes/ is scaffolded but not built; fix that, then run ' +
          '"npm run build --workspace=hydration-recipes" by hand',
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
