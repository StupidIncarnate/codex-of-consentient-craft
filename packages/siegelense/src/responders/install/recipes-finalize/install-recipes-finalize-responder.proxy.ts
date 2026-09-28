import { spawn, type ChildProcess } from 'child_process';
import { EventEmitter, Readable } from 'stream';
import { PackageNameStub } from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { npmInstallAdapterProxy } from '../../../adapters/npm/install/npm-install-adapter.proxy';
import { npmRunBuildAdapterProxy } from '../../../adapters/npm/run-build/npm-run-build-adapter.proxy';
import { recipesScaffoldState } from '../../../state/recipes-scaffold/recipes-scaffold-state';
import { recipesScaffoldStateProxy } from '../../../state/recipes-scaffold/recipes-scaffold-state.proxy';
import { InstallRecipesFinalizeResponder } from './install-recipes-finalize-responder';

// npmInstallAdapter and npmRunBuildAdapter both spawn bare `npm`, so `command` alone cannot tell
// the two calls apart under the shared childProcessSpawnCaptureAdapterProxy's command-only
// addressing (the same collision git-detect-base-branch-broker.proxy.ts documents for two `git`
// calls) — addressing on the full args array instead discriminates them directly, in either order.
const NPM_INSTALL_ARGS = ['install'];
const DEFAULT_BUILD_ARGS = ['run', 'build', '--workspace=hydration-recipes'];

const createNpmChild = ({
  exitCode,
  stderr,
}: {
  exitCode: number;
  stderr: string;
}): ChildProcess => {
  const child = new EventEmitter() as ChildProcess;
  child.stdout = new Readable({
    read(): void {
      /* noop */
    },
  });
  child.stderr = new Readable({
    read(): void {
      /* noop */
    },
  });

  const mockStderr = child.stderr;

  setImmediate(() => {
    if (stderr.length > 0) {
      mockStderr.push(Buffer.from(stderr));
    }
    mockStderr.push(null);
    child.stdout?.push(null);
    child.emit('exit', exitCode, null);
  });

  return child;
};

export const InstallRecipesFinalizeResponderProxy = (): {
  callResponder: typeof InstallRecipesFinalizeResponder;
  setupNothingScaffolded: () => void;
  setupScaffolded: (params?: { recipesPackageName?: string }) => void;
  setupInstallFails: (params: { output: string }) => void;
  setupBuildFails: (params: { output: string; buildArgs?: readonly string[] }) => void;
  getInstallSpawnArgs: () => unknown;
  getBuildSpawnArgs: () => unknown;
  wasInstallSpawnedFromCwd: (params: { cwd: string }) => boolean;
  wasBuildSpawnedFromCwd: (params: { cwd: string; buildArgs?: readonly string[] }) => boolean;
  wasNpmSpawned: () => boolean;
} => {
  const recipesStateProxy = recipesScaffoldStateProxy();
  // Created but unstaged: the real implementation composes npmInstallAdapter/npmRunBuildAdapter
  // (which themselves compose childProcessSpawnCaptureAdapter), but this proxy answers `spawn`
  // directly (see the module comment above) so neither adapter proxy's own constructor-level
  // default ever fires.
  npmInstallAdapterProxy();
  npmRunBuildAdapterProxy();
  const spawnHandle = registerMock({ fn: spawn });

  const stageInstall = ({ exitCode, stderr }: { exitCode: number; stderr: string }): void => {
    spawnHandle
      .calledWith(['npm', NPM_INSTALL_ARGS])
      .implement(() => createNpmChild({ exitCode, stderr }));
  };

  const stageBuild = ({
    args,
    exitCode,
    stderr,
  }: {
    args: readonly string[];
    exitCode: number;
    stderr: string;
  }): void => {
    spawnHandle.calledWith(['npm', args]).implement(() => createNpmChild({ exitCode, stderr }));
  };

  // Reads the spawned `cwd` by substring rather than a structural cast on the captured `unknown`
  // options object — `ban-adhoc-types` forbids `as {cwd?: unknown}` in a responders/ file, and a
  // JSON-string search proves the same fact without one.
  const wasSpawnedFromCwd = ({ args, cwd }: { args: readonly string[]; cwd: string }): boolean =>
    JSON.stringify(spawnHandle.callsMatching(['npm', args]).at(-1)?.[2] ?? {}).includes(
      `"cwd":${JSON.stringify(cwd)}`,
    );

  return {
    callResponder: InstallRecipesFinalizeResponder,

    // Nothing was scaffolded this run — clears recipesScaffoldState so a test does not inherit
    // whatever an earlier test in this file may have left pending.
    setupNothingScaffolded: (): void => {
      recipesStateProxy.setupEmpty();
    },

    // Marks the state the way InstallRecipesScaffoldResponder does mid-run, then stages both npm
    // calls as succeeding by default — setupInstallFails/setupBuildFails re-stage one address
    // afterward and win, per registerMock's most-recent-wins rule.
    setupScaffolded: ({ recipesPackageName }: { recipesPackageName?: string } = {}): void => {
      recipesStateProxy.setupEmpty();
      const packageName = PackageNameStub({ value: recipesPackageName ?? 'hydration-recipes' });
      recipesScaffoldState.markScaffolded({ recipesPackageName: packageName });

      stageInstall({ exitCode: 0, stderr: '' });
      stageBuild({ args: ['run', 'build', `--workspace=${packageName}`], exitCode: 0, stderr: '' });
    },

    // Build is left unstaged: the responder must short-circuit on a failed install rather than
    // attempt to build a workspace `npm install` never linked into node_modules — an unstaged
    // build call throws "nothing set up", which fails the test if the short-circuit regresses.
    setupInstallFails: ({ output }: { output: string }): void => {
      stageInstall({ exitCode: 1, stderr: output });
    },

    setupBuildFails: ({
      output,
      buildArgs,
    }: {
      output: string;
      buildArgs?: readonly string[];
    }): void => {
      stageBuild({ args: buildArgs ?? DEFAULT_BUILD_ARGS, exitCode: 1, stderr: output });
    },

    getInstallSpawnArgs: (): unknown =>
      spawnHandle.callsMatching(['npm', NPM_INSTALL_ARGS]).at(-1)?.[1],

    getBuildSpawnArgs: (): unknown =>
      spawnHandle.callsMatching(['npm', DEFAULT_BUILD_ARGS]).at(-1)?.[1],

    wasInstallSpawnedFromCwd: ({ cwd }: { cwd: string }): boolean =>
      wasSpawnedFromCwd({ args: NPM_INSTALL_ARGS, cwd }),

    wasBuildSpawnedFromCwd: ({
      cwd,
      buildArgs,
    }: {
      cwd: string;
      buildArgs?: readonly string[];
    }): boolean => wasSpawnedFromCwd({ args: buildArgs ?? DEFAULT_BUILD_ARGS, cwd }),

    wasNpmSpawned: (): boolean => spawnHandle.callsMatching(['npm']).length > 0,
  };
};
