/**
 * PURPOSE: Manages parsed chat entries per execution slot with configurable max entry limits
 *
 * USAGE:
 * agentOutputState.append({slotIndex: slotIndexContract.parse(0), entries: [chatEntry]});
 * agentOutputState.get({slotIndex: slotIndexContract.parse(0)});
 * // Returns ChatEntry[] for the slot
 */

import type { ChatEntry } from '../../contracts/chat-entry/chat-entry-contract';
import type { SlotCount } from '../../contracts/slot-count/slot-count-contract';
import { slotCountContract } from '../../contracts/slot-count/slot-count-contract';
import type { SlotIndex } from '../../contracts/slot-index/slot-index-contract';
import { agentOutputConfigStatics } from '../../statics/agent-output-config/agent-output-config-statics';

const state = {
  slots: new Map<SlotIndex, ChatEntry[]>(),
};

export const agentOutputState = {
  get: ({ slotIndex }: { slotIndex: SlotIndex }): ChatEntry[] =>
    state.slots.get(slotIndex) ?? ([] as ChatEntry[]),

  append: ({ slotIndex, entries }: { slotIndex: SlotIndex; entries: ChatEntry[] }): void => {
    const existing = state.slots.get(slotIndex) ?? ([] as ChatEntry[]);
    const combined = [...existing, ...entries];
    const maxLines = agentOutputConfigStatics.limits.maxLinesPerSlot;

    if (combined.length > maxLines) {
      state.slots.set(slotIndex, combined.slice(combined.length - maxLines));
    } else {
      state.slots.set(slotIndex, combined);
    }
  },

  clear: (): void => {
    state.slots.clear();
  },

  clearSlot: ({ slotIndex }: { slotIndex: SlotIndex }): void => {
    state.slots.delete(slotIndex);
  },

  getAll: (): Map<SlotIndex, ChatEntry[]> => new Map(state.slots),

  size: (): SlotCount => slotCountContract.parse(state.slots.size),
} as const;
