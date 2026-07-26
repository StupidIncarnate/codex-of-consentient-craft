import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { QuestId } from '@dungeonmaster/shared/contracts';

export const orchestratorPauseQuestAdapterProxy = (): {
  returns: (params: { questId: QuestId; paused: boolean }) => void;
  throws: (params: { questId: QuestId; error: Error }) => void;
} => {
  const mock = registerMock({ fn: StartOrchestrator.pauseQuest });

  return {
    returns: ({ questId, paused }: { questId: QuestId; paused: boolean }): void => {
      mock.calledWith([{ questId }]).resolves({ paused });
    },
    throws: ({ questId, error }: { questId: QuestId; error: Error }): void => {
      mock.calledWith([{ questId }]).rejects(error);
    },
  };
};
