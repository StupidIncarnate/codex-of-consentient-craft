/**
 * PURPOSE: Proxy for stepHandlerCleanupBroker — mocks the child-process spawn boundary and
 * questRepoRootBroker (its own dedicated test suite), matching the ward/riftcarver/commit handler
 * proxies' shape.
 *
 * `streamLinesProxy` (composed inertly below, to satisfy `enforce-proxy-child-creation` for the
 * broker's `streamLines` import) addresses the underlying `spawn` by command alone and exposes no
 * way to read back the `cwd` option or the exact command string — unlike `runProxy`'s
 * `getOptionsFor`, added in F29 for exactly this need. This handler's own tests assert both, so the
 * mock below targets `streamLines` itself directly, the same boundary the pre-migration adapter
 * proxy staged.
 *
 * USAGE:
 * const proxy = stepHandlerCleanupBrokerProxy();
 * proxy.cleanupExits({ exitCode: ExitCodeStub({ value: 0 }), answer: CleanupAnswerStub() });
 * const result = await stepHandlerCleanupBroker({ args: [], questId, workItemId, onLine: () => undefined });
 */

import { streamLines } from '#gateway/node/child_process';
import { streamLinesProxy } from '#gateway/node/child_process/stream-lines/stream-lines.proxy';
import { RunNotFoundErrorProxy } from '#gateway/node/child_process/run-not-found.error.proxy';
import {
  ErrorMessageStub,
  ExitCodeStub,
  RepoRootCwdStub,
  type ErrorMessage,
  type ExitCode,
} from '@dungeonmaster/shared/contracts';
import { registerMock, registerModuleMock } from '@dungeonmaster/testing/register-mock';

import type { CleanupAnswer } from '../../../contracts/cleanup-answer/cleanup-answer-contract';
import { cleanupCliCallStatics } from '../../../statics/cleanup-cli-call/cleanup-cli-call-statics';
import { questRepoRootBroker } from '../../quest/repo-root/quest-repo-root-broker';
import { questRepoRootBrokerProxy } from '../../quest/repo-root/quest-repo-root-broker.proxy';

registerModuleMock({ module: '../../quest/repo-root/quest-repo-root-broker' });

export const stepHandlerCleanupBrokerProxy = (): {
  cleanupExits: (params: { exitCode: ExitCode; answer: CleanupAnswer }) => void;
  cleanupFails: (params: { exitCode: ExitCode; output: string }) => void;
  cleanupPrintsInvalidJson: () => void;
  getSpawnedCommand: () => unknown;
  getSpawnedArgs: () => unknown;
  getSpawnedCwd: () => unknown;
} => {
  // Inert — satisfies enforce-proxy-child-creation. The module mock above replaces
  // questRepoRootBroker's export; this proxy's own internal staging is never exercised.
  questRepoRootBrokerProxy();
  const repoRootMock = registerMock({ fn: questRepoRootBroker });
  repoRootMock.calledWith([]).resolves(RepoRootCwdStub({ value: '/repo' }));

  // Inert for the same reason (see the file header) — this handler stages `streamLines` directly
  // below (its exact output has to replay through the caller's onLine, and its cwd/command have to
  // be read back, neither of which streamLinesProxy's own methods support).
  streamLinesProxy();
  RunNotFoundErrorProxy();
  const spawnHandle = registerMock({ fn: streamLines });
  const runResult: { exitCode: ExitCode; output: ErrorMessage } = {
    exitCode: ExitCodeStub({ value: 0 }),
    output: ErrorMessageStub({ value: '{}' }),
  };
  const spawnImpl = async ({
    onLine,
  }: Parameters<typeof streamLines>[0]): Promise<{
    exitCode: ExitCode;
    output: ErrorMessage;
  }> => {
    for (const line of String(runResult.output)
      .split('\n')
      .filter((entry) => entry.length > 0)) {
      onLine(line);
    }
    return Promise.resolve(runResult);
  };
  // Addressed by `command`, not an unaddressed `[]` catch-all — see stepHandlerWardBrokerProxy's
  // own comment on the identical fix: stepHandlerRunBrokerProxy composes every handler proxy
  // together, and an unaddressed sticky registration here would collide with ward's (and
  // riftcarver's typecheck) spawn on the SAME shared function.
  spawnHandle
    .calledWith([{ command: cleanupCliCallStatics.call.bin }])
    .implement(spawnImpl as never);

  return {
    cleanupExits: ({ exitCode, answer }: { exitCode: ExitCode; answer: CleanupAnswer }): void => {
      runResult.exitCode = exitCode;
      runResult.output = ErrorMessageStub({ value: JSON.stringify(answer) });
    },

    cleanupFails: ({ exitCode, output }: { exitCode: ExitCode; output: string }): void => {
      runResult.exitCode = exitCode;
      runResult.output = ErrorMessageStub({ value: output });
    },

    cleanupPrintsInvalidJson: (): void => {
      runResult.exitCode = ExitCodeStub({ value: 0 });
      runResult.output = ErrorMessageStub({ value: 'not json' });
    },

    getSpawnedCommand: (): unknown => {
      const [call] = spawnHandle.callsMatching([]);
      return (call?.[0] as Parameters<typeof streamLines>[0] | undefined)?.command;
    },

    getSpawnedArgs: (): unknown => {
      const [call] = spawnHandle.callsMatching([]);
      return (call?.[0] as Parameters<typeof streamLines>[0] | undefined)?.args;
    },

    getSpawnedCwd: (): unknown => {
      const [call] = spawnHandle.callsMatching([]);
      return (call?.[0] as Parameters<typeof streamLines>[0] | undefined)?.cwd;
    },
  };
};
