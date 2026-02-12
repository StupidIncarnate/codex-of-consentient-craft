/**
 * PURPOSE: Manages agent output lines per execution slot with configurable max line limits
 *
 * USAGE:
 * agentOutputState.append({slotIndex: slotIndexContract.parse(0), lines: [agentOutputLineContract.parse('Done.')]});
 * agentOutputState.get({slotIndex: slotIndexContract.parse(0)});
 * // Returns AgentOutputLine[] for the slot
 */

import type { AgentOutputLine } from '../../contracts/agent-output-line/agent-output-line-contract';
import type { SlotCount } from '../../contracts/slot-count/slot-count-contract';
import { slotCountContract } from '../../contracts/slot-count/slot-count-contract';
import type { SlotIndex } from '../../contracts/slot-index/slot-index-contract';
import { agentOutputConfigStatics } from '../../statics/agent-output-config/agent-output-config-statics';

const state = {
  slots: new Map<SlotIndex, AgentOutputLine[]>(),
};

export const agentOutputState = {
  get: ({ slotIndex }: { slotIndex: SlotIndex }): AgentOutputLine[] =>
    state.slots.get(slotIndex) ?? ([] as AgentOutputLine[]),

  append: ({ slotIndex, lines }: { slotIndex: SlotIndex; lines: AgentOutputLine[] }): void => {
    const existing = state.slots.get(slotIndex) ?? ([] as AgentOutputLine[]);
    const combined = [...existing, ...lines];
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

  getAll: (): Map<SlotIndex, AgentOutputLine[]> => new Map(state.slots),

  size: (): SlotCount => slotCountContract.parse(state.slots.size),
} as const;
