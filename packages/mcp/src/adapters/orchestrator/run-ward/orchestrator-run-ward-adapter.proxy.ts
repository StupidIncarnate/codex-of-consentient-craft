/**
 * PURPOSE: Proxy for orchestrator-run-ward-adapter that mocks the orchestrator package
 *
 * USAGE:
 * const proxy = orchestratorRunWardAdapterProxy();
 * proxy.returns({ questId, workItemId, result: QuestRunWardResultStub() });
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { QuestRunWardResult } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import type { QuestId, QuestWorkItemId } from '@dungeonmaster/shared/contracts';

export const orchestratorRunWardAdapterProxy = (): {
  returns: (params: {
    questId: QuestId;
    workItemId: QuestWorkItemId;
    result: QuestRunWardResult;
  }) => void;
  throws: (params: { questId: QuestId; workItemId: QuestWorkItemId; error: Error }) => void;
} => {
  const handle = registerMock({ fn: StartOrchestrator.runWard });

  return {
    returns: ({
      questId,
      workItemId,
      result,
    }: {
      questId: QuestId;
      workItemId: QuestWorkItemId;
      result: QuestRunWardResult;
    }): void => {
      handle.calledWith([{ questId, workItemId }]).resolves(result);
    },
    throws: ({
      questId,
      workItemId,
      error,
    }: {
      questId: QuestId;
      workItemId: QuestWorkItemId;
      error: Error;
    }): void => {
      handle.calledWith([{ questId, workItemId }]).rejects(error);
    },
  };
};
