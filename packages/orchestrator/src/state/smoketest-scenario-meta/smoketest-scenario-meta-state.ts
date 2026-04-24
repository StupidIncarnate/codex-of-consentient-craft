/**
 * PURPOSE: Per-quest meta (caseId, name, startedAt) captured at enqueue time and read by the smoketest post-terminal listener to build the case result
 *
 * USAGE:
 * smoketestScenarioMetaState.register({ questId, meta });
 * const meta = smoketestScenarioMetaState.get({ questId });
 * smoketestScenarioMetaState.unregister({ questId });
 * smoketestScenarioMetaState.clear();
 */

import type { QuestId } from '@dungeonmaster/shared/contracts';

import type { SmoketestScenarioMeta } from '../../contracts/smoketest-scenario-meta/smoketest-scenario-meta-contract';

const state: { entries: Map<QuestId, SmoketestScenarioMeta> } = {
  entries: new Map(),
};

export const smoketestScenarioMetaState = {
  register: ({ questId, meta }: { questId: QuestId; meta: SmoketestScenarioMeta }): void => {
    state.entries.set(questId, meta);
  },

  get: ({ questId }: { questId: QuestId }): SmoketestScenarioMeta | undefined =>
    state.entries.get(questId),

  unregister: ({ questId }: { questId: QuestId }): void => {
    state.entries.delete(questId);
  },

  clear: (): void => {
    state.entries.clear();
  },
};
