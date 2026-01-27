/**
 * PURPOSE: Manages N concurrent agent slots for orchestrating parallel agent execution
 *
 * USAGE:
 * agentSlotsState.initialize({slotCount});
 * agentSlotsState.assignSlot({slotId, data});
 * agentSlotsState.releaseSlot({slotId});
 * agentSlotsState.getAvailableSlotId();
 * agentSlotsState.getActiveSlots();
 * // Tracks which slots have running agents
 */

import type { SlotCount } from '../../contracts/slot-count/slot-count-contract';
import { slotCountContract } from '../../contracts/slot-count/slot-count-contract';
import type { SlotData } from '../../contracts/slot-data/slot-data-contract';
import type { SlotIndex } from '../../contracts/slot-index/slot-index-contract';

const state = {
  slots: new Map<SlotIndex, SlotData | null>(),
  slotCount: undefined as SlotCount | undefined,
};

export const agentSlotsState = {
  initialize: ({ slotCount }: { slotCount: SlotCount }): void => {
    state.slots.clear();
    state.slotCount = slotCount;
    for (let i = 0; i < slotCount; i++) {
      state.slots.set(i as SlotIndex, null);
    }
  },

  assignSlot: ({ slotId, data }: { slotId: SlotIndex; data: SlotData }): void => {
    state.slots.set(slotId, data);
  },

  releaseSlot: ({ slotId }: { slotId: SlotIndex }): boolean => {
    if (state.slots.has(slotId)) {
      state.slots.set(slotId, null);
      return true;
    }
    return false;
  },

  getSlot: ({ slotId }: { slotId: SlotIndex }): SlotData | null | undefined =>
    state.slots.get(slotId),

  getAvailableSlotId: (): SlotIndex | undefined => {
    for (const [slotId, data] of state.slots.entries()) {
      if (data === null) {
        return slotId;
      }
    }
    return undefined;
  },

  getActiveSlots: (): { slotId: SlotIndex; data: SlotData }[] => {
    const active: { slotId: SlotIndex; data: SlotData }[] = [];
    state.slots.forEach((data, slotId) => {
      if (data !== null) {
        active.push({ slotId, data });
      }
    });
    return active;
  },

  getActiveCount: (): SlotCount => {
    let count = 0;
    state.slots.forEach((data) => {
      if (data !== null) {
        count++;
      }
    });
    return slotCountContract.parse(count);
  },

  getSlotCount: (): SlotCount | undefined => state.slotCount,

  clear: (): void => {
    state.slots.clear();
    state.slotCount = undefined;
  },
} as const;
