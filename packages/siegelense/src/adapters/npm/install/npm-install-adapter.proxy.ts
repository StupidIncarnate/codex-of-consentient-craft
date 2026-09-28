import { runProxy } from '#gateway/node/child_process/run/run.proxy';
import { RunNotFoundErrorProxy } from '#gateway/node/child_process/run-not-found.error.proxy';

// Always bare `npm install`, so runProxy's own {command, args} staging (F25) tells this adapter's
// call apart from a SIBLING adapter's bare-`npm` call sharing the same mock (npmRunBuildAdapter,
// composed alongside this one by install-recipes-scaffold-responder.proxy.ts). Read-back filters
// to calls literally shaped `['install']`, so that composition's own getSpawnedArgs()/
// getSpawnedCwd() never returns the OTHER adapter's call once both have run.
const NPM_COMMAND = 'npm';
const NPM_INSTALL_ARGS = ['install'];

export const npmInstallAdapterProxy = (): {
  setupSuccess: () => void;
  setupFailure: (params: { output: string }) => void;
  setupNpmNotFound: () => void;
  getSpawnedArgs: () => unknown;
  getSpawnedCwd: () => unknown;
} => {
  const run = runProxy();
  // Created but unstaged: RunNotFoundError is a plain class with nothing to mock — composing its
  // proxy satisfies enforce-proxy-child-creation for the adapter's own `instanceof` import.
  RunNotFoundErrorProxy();

  return {
    setupSuccess: (): void => {
      run.setupSuccess({
        command: NPM_COMMAND,
        args: NPM_INSTALL_ARGS,
        exitCode: 0,
        stdout: '',
        stderr: '',
      });
    },

    setupFailure: ({ output }: { output: string }): void => {
      run.setupSuccess({
        command: NPM_COMMAND,
        args: NPM_INSTALL_ARGS,
        exitCode: 1,
        stdout: '',
        stderr: output,
      });
    },

    // npm itself is missing: `run` rejects with RunNotFoundError, which the adapter catches and
    // folds into the same failed-run shape the old childProcessSpawnCaptureAdapter resolved for
    // an ENOENT.
    setupNpmNotFound: (): void => {
      run.setupError({
        command: NPM_COMMAND,
        args: NPM_INSTALL_ARGS,
        error: Object.assign(new Error('spawn npm ENOENT'), { code: 'ENOENT' }),
      });
    },

    // Filters to calls literally shaped `['install']` (this adapter's own fixed first token) so a
    // sibling proxy sharing this same `npm` mock (npmRunBuildAdapterProxy, composed alongside this
    // one by install-recipes-scaffold-responder.proxy.ts) never answers for the OTHER adapter's call.
    getSpawnedArgs: (): unknown =>
      run
        .getCallsFor({ command: NPM_COMMAND })
        .filter((args) => args[0] === 'install')
        .at(-1),

    getSpawnedCwd: (): unknown => {
      const argsList = run.getCallsFor({ command: NPM_COMMAND });
      const optionsList = run.getOptionsFor({ command: NPM_COMMAND });
      const matchingIndexes = argsList
        .map((args, index) => ({ args, index }))
        .filter((entry) => entry.args[0] === 'install');
      const lastMatch = matchingIndexes.at(-1);
      return lastMatch === undefined ? undefined : optionsList[lastMatch.index]?.cwd;
    },
  };
};
