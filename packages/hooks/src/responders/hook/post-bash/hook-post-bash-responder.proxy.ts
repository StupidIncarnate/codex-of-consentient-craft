/**
 * PURPOSE: Proxy for HookPostBashResponder that stages the `dungeonmaster gateway-sync` child
 * process at the spawn level, addressed by command, args and cwd, so a test proves which directory
 * the sync ran in and what reached the agent.
 *
 * USAGE:
 * const proxy = HookPostBashResponderProxy();
 * proxy.setupSyncSucceeds({ cwd: '/repo', output: 'generated: left-pad\n' });
 * // ... call responder ...
 * proxy.getSyncSpawns();
 * // Returns [{ args: ['gateway-sync'], cwd: '/repo' }]
 */
import { runProxy } from '#gateway/node/child_process/run/run.proxy';
import { FileMissingErrorStub } from '#gateway/node/fs/file-missing-error/file-missing-error.stub';

import { gatewaySyncHookStatics } from '../../../statics/gateway-sync-hook/gateway-sync-hook-statics';

const COMMAND = gatewaySyncHookStatics.command.name;
const ARGS = [...gatewaySyncHookStatics.command.args];

export const HookPostBashResponderProxy = (): {
  setupSyncSucceeds: (params: { cwd: string; output: string }) => void;
  setupSyncFails: (params: { cwd: string; exitCode: number; output: string }) => void;
  setupSyncMissing: (params: { cwd: string }) => void;
  getSyncSpawns: () => readonly { args: readonly string[]; cwd: string }[];
} => {
  const run = runProxy();

  return {
    setupSyncSucceeds: ({ cwd, output }: { cwd: string; output: string }): void => {
      run.setupSuccess({
        command: COMMAND,
        args: ARGS,
        cwd,
        exitCode: 0,
        stdout: output,
        stderr: '',
      });
    },
    setupSyncFails: ({
      cwd,
      exitCode,
      output,
    }: {
      cwd: string;
      exitCode: number;
      output: string;
    }): void => {
      run.setupSuccess({ command: COMMAND, args: ARGS, cwd, exitCode, stdout: '', stderr: output });
    },
    setupSyncMissing: ({ cwd }: { cwd: string }): void => {
      run.setupError({
        command: COMMAND,
        args: ARGS,
        cwd,
        error: FileMissingErrorStub({ path: COMMAND }),
      });
    },
    getSyncSpawns: (): readonly { args: readonly string[]; cwd: string }[] => {
      const options = run.getOptionsFor({ command: COMMAND });
      return run
        .getCallsFor({ command: COMMAND })
        .map((args, index) => ({ args, cwd: options[index]?.cwd ?? '' }));
    },
  };
};
