/**
 * PURPOSE: Proxy for orchestrator-run-riftcarver-adapter that mocks the orchestrator package
 *
 * USAGE:
 * const proxy = orchestratorRunRiftcarverAdapterProxy();
 * proxy.returns({ questId, workItemId, result: QuestRunRiftcarverResultStub() });
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { QuestRunRiftcarverResult } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import type { QuestId, QuestWorkItemId } from '@dungeonmaster/shared/contracts';

export const orchestratorRunRiftcarverAdapterProxy = (): {
  returns: (params: {
    questId: QuestId;
    workItemId: QuestWorkItemId;
    result: QuestRunRiftcarverResult;
  }) => void;
  throws: (params: { questId: QuestId; workItemId: QuestWorkItemId; error: Error }) => void;
} => {
  const handle = registerMock({ fn: StartOrchestrator.runRiftcarver });

  return {
    returns: ({
      questId,
      workItemId,
      result,
    }: {
      questId: QuestId;
      workItemId: QuestWorkItemId;
      result: QuestRunRiftcarverResult;
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
