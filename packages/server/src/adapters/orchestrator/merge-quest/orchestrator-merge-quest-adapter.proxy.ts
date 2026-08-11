import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { QuestId } from '@dungeonmaster/shared/contracts';

export const orchestratorMergeQuestAdapterProxy = (): {
  returns: (params: { questId: QuestId; merging: boolean }) => void;
  throws: (params: { questId: QuestId; error: Error }) => void;
  getCalls: () => readonly unknown[];
} => {
  const mock = registerMock({ fn: StartOrchestrator.mergeQuest });

  return {
    returns: ({ questId, merging }: { questId: QuestId; merging: boolean }): void => {
      mock.calledWith([{ questId }]).resolves({ merging });
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
