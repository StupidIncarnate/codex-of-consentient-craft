import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { ProcessIdStub, QuestId } from '@dungeonmaster/shared/contracts';

type ProcessId = ReturnType<typeof ProcessIdStub>;

export const orchestratorClarifyAdapterProxy = (): {
  returns: (params: { questId: QuestId; chatProcessId: ProcessId }) => void;
  throws: (params: { questId: QuestId; error: Error }) => void;
  getLastCalledArgs: (params: { questId: QuestId }) => unknown;
} => {
  const mock = registerMock({ fn: StartOrchestrator.clarifyAnswer });

  return {
    returns: ({ questId, chatProcessId }: { questId: QuestId; chatProcessId: ProcessId }): void => {
      mock.calledWith([{ questId }]).resolves({ chatProcessId });
    },
    throws: ({ questId, error }: { questId: QuestId; error: Error }): void => {
      mock.calledWith([{ questId }]).rejects(error);
    },
    getLastCalledArgs: ({ questId }: { questId: QuestId }): unknown =>
      mock.callsMatching([{ questId }]).at(-1)?.[0],
  };
};
