/**
 * PURPOSE: Proxy for run-riftcarver-layer-responder. Delegates to the orchestrator adapter proxy.
 *
 * USAGE:
 * const proxy = RunRiftcarverLayerResponderProxy();
 * proxy.setupReturns({ questId, workItemId, result: QuestRunRiftcarverResultStub() });
 */

import { QuestRunRiftcarverResultStub } from '@dungeonmaster/orchestrator/testing';
import type { QuestIdStub, QuestWorkItemIdStub } from '@dungeonmaster/shared/contracts';

import { orchestratorRunRiftcarverAdapterProxy } from '../../../adapters/orchestrator/run-riftcarver/orchestrator-run-riftcarver-adapter.proxy';

type QuestId = ReturnType<typeof QuestIdStub>;
type QuestWorkItemId = ReturnType<typeof QuestWorkItemIdStub>;
type QuestRunRiftcarverResult = ReturnType<typeof QuestRunRiftcarverResultStub>;

export const RunRiftcarverLayerResponderProxy = (): {
  setupReturns: (params: {
    questId: QuestId;
    workItemId: QuestWorkItemId;
    result: QuestRunRiftcarverResult;
  }) => void;
  setupThrows: (params: { questId: QuestId; workItemId: QuestWorkItemId; error: Error }) => void;
  buildResult: () => QuestRunRiftcarverResult;
} => {
  const adapterProxy = orchestratorRunRiftcarverAdapterProxy();

  return {
    setupReturns: ({
      questId,
      workItemId,
      result,
    }: {
      questId: QuestId;
      workItemId: QuestWorkItemId;
      result: QuestRunRiftcarverResult;
    }): void => {
      adapterProxy.returns({ questId, workItemId, result });
    },
    setupThrows: ({
      questId,
      workItemId,
      error,
    }: {
      questId: QuestId;
      workItemId: QuestWorkItemId;
      error: Error;
    }): void => {
      adapterProxy.throws({ questId, workItemId, error });
    },
    buildResult: (): QuestRunRiftcarverResult => QuestRunRiftcarverResultStub(),
  };
};
