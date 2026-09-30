/**
 * PURPOSE: Per-quest registry of active smoketest post-terminal listeners — holds the scenario assertions + teardown checks + driver-stop handle so the terminal-event handler can look up what to run when a smoketest quest hits terminal status
 *
 * USAGE:
 * smoketestListenerState.register({ questId, entry });
 * smoketestListenerState.get({ questId });
 * smoketestListenerState.unregister({ questId });
 * smoketestListenerState.clear();
 */

import type { Quest } from '@dungeonmaster/shared/contracts';

import type { SmoketestListenerEntry } from '../../contracts/smoketest-listener-entry/smoketest-listener-entry-contract';

const state: { entries: Map<Quest['id'], SmoketestListenerEntry> } = {
  entries: new Map(),
};

export const smoketestListenerState = {
  register: ({ questId, entry }: { questId: Quest['id']; entry: SmoketestListenerEntry }): void => {
    state.entries.set(questId, entry);
  },

  get: ({ questId }: { questId: Quest['id'] }): SmoketestListenerEntry | undefined =>
    state.entries.get(questId),

  unregister: ({ questId }: { questId: Quest['id'] }): void => {
    state.entries.delete(questId);
  },

  getAllQuestIds: (): readonly Quest['id'][] => Array.from(state.entries.keys()),

  clear: (): void => {
    state.entries.clear();
  },
};
