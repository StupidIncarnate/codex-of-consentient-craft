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
 * proxy.setupWardDone({ questId });
 * const result = await stepHandlerRunBroker({ handler: 'ward', args: [], questId, workItemId, onLine: () => undefined });
 */

import type { Quest } from '@dungeonmaster/shared/contracts';
import { wardExitCodeStatics } from '@dungeonmaster/shared/statics';

import { CleanupCliAnswerStub } from '../../../contracts/cleanup-cli-answer/cleanup-cli-answer.stub';
import { stepHandlerCleanupBrokerProxy } from '../cleanup/step-handler-cleanup-broker.proxy';
import { stepHandlerCommitBrokerProxy } from '../commit/step-handler-commit-broker.proxy';
import { stepHandlerRiftcarverBrokerProxy } from '../riftcarver/step-handler-riftcarver-broker.proxy';
import { stepHandlerWardBrokerProxy } from '../ward/step-handler-ward-broker.proxy';

export const stepHandlerRunBrokerProxy = (): {
  setupWardDone: (params: { questId: Quest['id'] }) => void;
  setupWardMissingWorktree: (params: { questId: Quest['id']; worktreePath: string }) => void;
  setupCleanupDone: (params: { questId: Quest['id'] }) => void;
} => {
  const cleanupProxy = stepHandlerCleanupBrokerProxy();
  // Inert — composed to satisfy enforce-proxy-child-creation against this file's imports. Their
  // own dispatch paths are already proven by their own colocated test suites.
  stepHandlerCommitBrokerProxy();
  stepHandlerRiftcarverBrokerProxy();
  // Composed last: the ward handler's proxy stages its own `questFindQuestPathBroker` answer, and a
  // sibling proxy composing the find-quest-path proxy after it would replace that answer.
  const wardProxy = stepHandlerWardBrokerProxy();

  return {
    setupWardDone: ({ questId }: { questId: Quest['id'] }): void => {
      wardProxy.wardExits({
        questId,
        exitCode: wardExitCodeStatics.exitCodes.pass,
        runId: '1780108054226-a080',
        detailJson: '{"checks":[]}',
      });
    },

    setupWardMissingWorktree: ({
      questId,
      worktreePath,
    }: {
      questId: Quest['id'];
      worktreePath: string;
    }): void => {
      wardProxy.setupWorktreeMissing({ questId, worktreePath });
    },

    setupCleanupDone: ({ questId }: { questId: Quest['id'] }): void => {
      cleanupProxy.cleanupExits({
        questId,
        exitCode: 0,
        answer: CleanupCliAnswerStub({ lockReleased: true }),
      });
    },
  };
};
