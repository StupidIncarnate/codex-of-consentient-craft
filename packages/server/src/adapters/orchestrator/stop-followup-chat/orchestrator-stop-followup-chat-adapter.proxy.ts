import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { QuestId } from '@dungeonmaster/shared/contracts';

export const orchestratorStopFollowupChatAdapterProxy = (): {
  returns: (params: { questId: QuestId; stopped: boolean }) => void;
  throws: (params: { questId: QuestId; error: Error }) => void;
  getCalls: () => readonly unknown[];
} => {
  const mock = registerMock({ fn: StartOrchestrator.stopFollowupChat });

  return {
    returns: ({ questId, stopped }: { questId: QuestId; stopped: boolean }): void => {
      mock.calledWith([{ questId }]).resolves({ stopped });
    },
    throws: ({ questId, error }: { questId: QuestId; error: Error }): void => {
      mock.calledWith([{ questId }]).rejects(error);
    },
    // Unaddressed on purpose: a bad-params test needs to prove the adapter was reached ZERO times,
    // which an addressed read cannot express.
    getCalls: (): readonly unknown[] =>
      mock.callsMatching([]).map(([firstArg]: readonly unknown[]) => firstArg),
  };
};
