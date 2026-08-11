import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { ProcessIdStub } from '@dungeonmaster/shared/contracts';
import type { QuestId } from '@dungeonmaster/shared/contracts';

type ProcessId = ReturnType<typeof ProcessIdStub>;

export const orchestratorStartFollowupChatAdapterProxy = (): {
  returns: (params: { questId: QuestId; chatProcessId: ProcessId }) => void;
  throws: (params: { questId: QuestId; error: Error }) => void;
  getCalls: () => readonly unknown[];
} => {
  const mock = registerMock({ fn: StartOrchestrator.startFollowupChat });

  return {
    returns: ({ questId, chatProcessId }: { questId: QuestId; chatProcessId: ProcessId }): void => {
      mock.calledWith([{ questId }]).resolves({ chatProcessId });
    },
    throws: ({ questId, error }: { questId: QuestId; error: Error }): void => {
      mock.calledWith([{ questId }]).rejects(error);
    },
    // Unaddressed on purpose: a status-gate test needs to prove the adapter was reached ZERO
    // times, which an addressed read cannot express.
    getCalls: (): readonly unknown[] =>
      mock.callsMatching([]).map(([firstArg]: readonly unknown[]) => firstArg),
  };
};
