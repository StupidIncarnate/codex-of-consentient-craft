import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import type { QuestStub } from '@dungeonmaster/shared/contracts';

type Quest = ReturnType<typeof QuestStub>;

export const operationQueryRouteBrokerProxy = (): {
  succeeds: ({ quest }: { quest: Quest }) => void;
} => {
  const getQuestHandle = registerMock({ fn: StartOrchestrator.getQuest });

  return {
    succeeds: ({ quest }: { quest: Quest }): void => {
      getQuestHandle.calledWith([{ questId: quest.id }]).resolves({ success: true, quest });
    },
  };
};
