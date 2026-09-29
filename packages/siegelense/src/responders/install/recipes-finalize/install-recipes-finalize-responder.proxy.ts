import { PackageNameStub } from '@dungeonmaster/shared/contracts';

import { installProxy } from '#gateway/bin/npm/install/install.proxy';
import { runBuildProxy } from '#gateway/bin/npm/run-build/run-build.proxy';
import { recipesScaffoldState } from '../../../state/recipes-scaffold/recipes-scaffold-state';
import { recipesScaffoldStateProxy } from '../../../state/recipes-scaffold/recipes-scaffold-state.proxy';
import { InstallRecipesFinalizeResponder } from './install-recipes-finalize-responder';

const DEFAULT_WORKSPACE = 'hydration-recipes';

const isCallRecord = (call: unknown): call is { args: unknown; cwd: unknown } =>
  typeof call === 'object' && call !== null && 'args' in call && 'cwd' in call;

export const InstallRecipesFinalizeResponderProxy = (): {
  callResponder: typeof InstallRecipesFinalizeResponder;
  setupNothingScaffolded: () => void;
  setupScaffolded: (params?: { recipesPackageName?: string }) => void;
  setupInstallFails: (params: { output: string }) => void;
  setupBuildFails: (params: { output: string; workspace?: string }) => void;
  getInstallSpawnArgs: () => unknown;
  getBuildSpawnArgs: () => unknown;
  wasInstallSpawnedFromCwd: (params: { cwd: string }) => boolean;
  wasBuildSpawnedFromCwd: (params: { cwd: string }) => boolean;
  wasNpmSpawned: () => boolean;
} => {
  const recipesStateProxy = recipesScaffoldStateProxy();
  const installGatewayProxy = installProxy();
  const buildGatewayProxy = runBuildProxy();

  const lastInstallCall = (): unknown => installGatewayProxy.getCallsFor().at(-1)?.[0];
  const lastBuildCall = (): unknown =>
    buildGatewayProxy.getCallsFor({ workspace: () => true }).at(-1)?.[0];

  return {
    callResponder: InstallRecipesFinalizeResponder,

    // Nothing was scaffolded this run — clears recipesScaffoldState so a test does not inherit
    // whatever an earlier test in this file may have left pending.
    setupNothingScaffolded: (): void => {
      recipesStateProxy.setupEmpty();
    },

    // Marks the state the way InstallRecipesScaffoldResponder does mid-run, then stages both npm
    // calls as succeeding — setupInstallFails/setupBuildFails re-stage the same address afterward
    // and win, per registerMock's most-recent-wins rule.
    setupScaffolded: ({ recipesPackageName }: { recipesPackageName?: string } = {}): void => {
      recipesStateProxy.setupEmpty();
      const packageName = PackageNameStub({ value: recipesPackageName ?? DEFAULT_WORKSPACE });
      recipesScaffoldState.markScaffolded({ recipesPackageName: packageName });

      installGatewayProxy.setupResult({ exitCode: 0, output: '' });
      buildGatewayProxy.setupResult({ workspace: packageName, exitCode: 0, output: '' });
    },

    // Build keeps its success staging: the assertion that it never ran reads the recorded calls,
    // so a regressed short-circuit shows up as a recorded build call.
    setupInstallFails: ({ output }: { output: string }): void => {
      installGatewayProxy.setupResult({ exitCode: 1, output });
    },

    setupBuildFails: ({ output, workspace }: { output: string; workspace?: string }): void => {
      buildGatewayProxy.setupResult({
        workspace: workspace ?? DEFAULT_WORKSPACE,
        exitCode: 1,
        output,
      });
    },

    getInstallSpawnArgs: (): unknown => {
      const call = lastInstallCall();
      return isCallRecord(call) ? call.args : undefined;
    },

    getBuildSpawnArgs: (): unknown => {
      const call = lastBuildCall();
      return isCallRecord(call) ? call.args : undefined;
    },

    wasInstallSpawnedFromCwd: ({ cwd }: { cwd: string }): boolean => {
      const call = lastInstallCall();
      return isCallRecord(call) && call.cwd === cwd;
    },

    wasBuildSpawnedFromCwd: ({ cwd }: { cwd: string }): boolean => {
      const call = lastBuildCall();
      return isCallRecord(call) && call.cwd === cwd;
    },

    wasNpmSpawned: (): boolean =>
      installGatewayProxy.getCallsFor().length > 0 ||
      buildGatewayProxy.getCallsFor({ workspace: () => true }).length > 0,
  };
};
