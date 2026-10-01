/**
 * PURPOSE: Resolves the command ward starts jest or Playwright with. Where the `source` export
 * condition is supported, that is `node --conditions=source <bin>`; elsewhere it is the bin itself.
 * Reach for this, not binResolveBroker, for any check whose runner loads workspace TypeScript.
 *
 * USAGE:
 * const runner = runnerCommandResolveBroker({ binName: 'jest', cwd: '/repo/packages/ward' });
 * // Returns { command: process.execPath, leadingArgs: ['--conditions=source', '/repo/node_modules/.bin/jest'] } in this monorepo
 * // Returns { command: '/repo/node_modules/.bin/jest', leadingArgs: [] } in a consumer's install
 *
 * WHY A NODE ARGUMENT AND NOT NODE_OPTIONS: the condition has to reach every process that loads
 * tests, and no other process. Jest forks its workers, and Playwright forks its runner and its
 * workers, each with the parent's `execArgv`, so all of them resolve workspace packages to source.
 * A test's own `spawn(process.execPath, ...)` does not inherit `execArgv`, so a built program a
 * test starts (a bundled CLI, an Electron main) loads its `dist/` as a consumer's would. NODE_OPTIONS
 * travels through the environment instead, into every descendant, and a built child then resolves
 * workspace imports to `.ts` files it cannot load. A test that wants a source child passes
 * `--conditions=source` to that child itself. A child started with `fork()` inherits `execArgv`
 * the way Jest's own workers do.
 *
 * The bin is run as a script, so it must be a JavaScript file. npm links `node_modules/.bin/<name>`
 * to the package's own JavaScript entry, which is the only layout the condition is ever applied to:
 * sourceConditionSupportedBroker answers true only inside a workspace that links dungeonmaster's
 * packages.
 */

import { execPath } from '#gateway/node/process';

import {
  runnerCommandContract,
  type RunnerCommand,
} from '../../../contracts/runner-command/runner-command-contract';
import { binResolveBroker } from '../../bin/resolve/bin-resolve-broker';
import { sourceConditionSupportedBroker } from '../../source-condition/supported/source-condition-supported-broker';

export const runnerCommandResolveBroker = ({
  binName,
  cwd,
}: {
  binName: string;
  cwd: string;
}): RunnerCommand => {
  const bin = binResolveBroker({ binName, cwd });

  return runnerCommandContract.parse(
    sourceConditionSupportedBroker({ cwd })
      ? { command: execPath, leadingArgs: ['--conditions=source', bin] }
      : { command: bin, leadingArgs: [] },
  );
};
