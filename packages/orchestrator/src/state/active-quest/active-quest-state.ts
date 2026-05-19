/**
 * PURPOSE: Singleton tracking the currently-active quest — the quest `get-next-step` last returned work for. Used by `quest-monitor-jsonl-watcher-broker` to tag every ChatEntry emitted during the watcher's window with the active questId, so the web UI can route per-quest broadcasts. Flips whenever the orchestrator advances to a new quest in the queue.
 *
 * USAGE:
 * activeQuestState.setActive({ questId });
 * activeQuestState.getActive();
 * activeQuestState.clear();
 */

import type { QuestId } from '@dungeonmaster/shared/contracts';

const state: { questId: QuestId | null } = {
  questId: null,
};

export const activeQuestState = {
  setActive: ({ questId }: { questId: QuestId | null }): void => {
    state.questId = questId;
  },

  getActive: (): QuestId | null => state.questId,

  clear: (): void => {
    state.questId = null;
  },
};
