import type { QuestId } from '@dungeonmaster/shared/contracts';

import { activeQuestState } from './active-quest-state';

export const activeQuestStateProxy = (): {
  setupEmpty: () => void;
  setupActive: (params: { questId: QuestId }) => void;
} => ({
  setupEmpty: (): void => {
    activeQuestState.clear();
  },
  setupActive: ({ questId }: { questId: QuestId }): void => {
    activeQuestState.clear();
    activeQuestState.setActive({ questId });
  },
});
