/**
 * PURPOSE: Proxy for stepHandlerRunBroker — composes all four handler proxies (the file imports
 * all four value exports, and `enforce-proxy-child-creation`/`enforce-proxy-patterns` require every
 * one composed eagerly, before the return). Runtime dispatch is proven for `ward` and `cleanup`
 * only — `commit` and `riftcarver` reach the handler table via the `satisfies
 * Record<StepHandlerName, StepHandler>` clause on `HANDLERS`, checked at typecheck time, and the
 * dispatch MECHANISM this broker adds is identical for all four, so a second and third runtime
 * proof would test the table lookup twice more rather than anything new.
 *
 * USAGE:
 * const proxy = stepHandlerRunBrokerProxy();
 * proxy.setupWardDone();
 * const result = await stepHandlerRunBroker({ handler: 'ward', args: [], questId, workItemId, onLine: () => undefined });
 */

import { ExitCodeStub, FileContentsStub, FileNameStub } from '@dungeonmaster/shared/contracts';
import { wardExitCodeStatics } from '@dungeonmaster/shared/statics';

import { CleanupAnswerStub } from '../../../contracts/cleanup-answer/cleanup-answer.stub';
import { stepHandlerCleanupBrokerProxy } from '../cleanup/step-handler-cleanup-broker.proxy';
import { stepHandlerCommitBrokerProxy } from '../commit/step-handler-commit-broker.proxy';
import { stepHandlerRiftcarverBrokerProxy } from '../riftcarver/step-handler-riftcarver-broker.proxy';
import { stepHandlerWardBrokerProxy } from '../ward/step-handler-ward-broker.proxy';

export const stepHandlerRunBrokerProxy = (): {
  setupWardDone: () => void;
  setupWardMissingWorktree: (params: { worktreePath: string }) => void;
  setupCleanupDone: () => void;
} => {
  const wardProxy = stepHandlerWardBrokerProxy();
  const cleanupProxy = stepHandlerCleanupBrokerProxy();
  // Inert — composed to satisfy enforce-proxy-child-creation against this file's imports. Their
  // own dispatch paths are already proven by their own colocated test suites.
  stepHandlerCommitBrokerProxy();
  stepHandlerRiftcarverBrokerProxy();

  return {
    setupWardDone: (): void => {
      wardProxy.wardExits({
        exitCode: ExitCodeStub({ value: wardExitCodeStatics.exitCodes.pass }),
        runId: FileNameStub({ value: '1780108054226-a080' }),
        detailJson: FileContentsStub({ value: '{"checks":[]}' }),
      });
    },

    setupWardMissingWorktree: ({ worktreePath }: { worktreePath: string }): void => {
      wardProxy.setupWorktreeMissing({ worktreePath });
    },

    setupCleanupDone: (): void => {
      cleanupProxy.cleanupExits({
        exitCode: ExitCodeStub({ value: 0 }),
        answer: CleanupAnswerStub({ lockReleased: true }),
      });
    },
  };
};
