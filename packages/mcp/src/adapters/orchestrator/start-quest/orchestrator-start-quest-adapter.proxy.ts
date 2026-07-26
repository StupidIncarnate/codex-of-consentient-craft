/**
 * PURPOSE: Proxy for orchestrator-start-quest-adapter that mocks the orchestrator package
 *
 * USAGE:
 * const proxy = orchestratorStartQuestAdapterProxy();
 * proxy.returns({ questId: QuestIdStub(), processId: ProcessIdStub() });
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { ProcessIdStub, QuestIdStub } from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';

type ProcessId = ReturnType<typeof ProcessIdStub>;
type QuestId = ReturnType<typeof QuestIdStub>;

export const orchestratorStartQuestAdapterProxy = (): {
  returns: (params: { questId: QuestId; processId: ProcessId }) => void;
  throws: (params: { questId: QuestId; error: Error }) => void;
} => {
  const handle = registerMock({ fn: StartOrchestrator.startQuest });

  return {
    returns: ({ questId, processId }: { questId: QuestId; processId: ProcessId }): void => {
      handle.calledWith([{ questId }]).resolves(processId);
    },
    throws: ({ questId, error }: { questId: QuestId; error: Error }): void => {
      handle.calledWith([{ questId }]).rejects(error);
    },
  };
};
