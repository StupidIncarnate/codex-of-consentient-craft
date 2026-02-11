/**
 * PURPOSE: Creates a SlotOperations interface backed by an in-memory Map for a given slot count
 *
 * USAGE:
 * const slotOperations = slotCountToSlotOperationsTransformer({slotCount: slotCountContract.parse(3)});
 * // Returns SlotOperations with getAvailableSlot, assignSlot, releaseSlot, getActiveSlots
 */

import type { AgentSlot } from '../../contracts/agent-slot/agent-slot-contract';
import type { SlotCount } from '../../contracts/slot-count/slot-count-contract';
import type { SlotIndex } from '../../contracts/slot-index/slot-index-contract';
import { slotOperationsContract } from '../../contracts/slot-operations/slot-operations-contract';
import type { SlotOperations } from '../../contracts/slot-operations/slot-operations-contract';

export const slotCountToSlotOperationsTransformer = ({
  slotCount,
}: {
  slotCount: SlotCount;
}): SlotOperations => {
  const slots = new Map<SlotIndex, AgentSlot | null>();
  for (let i = 0; i < slotCount; i++) {
    slots.set(i as SlotIndex, null);
  }

  return slotOperationsContract.parse({
    getAvailableSlot: (): SlotIndex | undefined => {
      for (const [slotIndex, data] of slots.entries()) {
        if (data === null) {
          return slotIndex;
        }
      }
      return undefined;
    },
    assignSlot: ({
      slotIndex,
      agentSlot,
    }: {
      slotIndex: SlotIndex;
      agentSlot: AgentSlot;
    }): void => {
      slots.set(slotIndex, agentSlot);
    },
    releaseSlot: ({ slotIndex }: { slotIndex: SlotIndex }): boolean => {
      if (slots.has(slotIndex)) {
        slots.set(slotIndex, null);
        return true;
      }
      return false;
    },
    getActiveSlots: (): { slotIndex: SlotIndex; agentSlot: AgentSlot }[] => {
      const active: { slotIndex: SlotIndex; agentSlot: AgentSlot }[] = [];
      slots.forEach((data, slotIndex) => {
        if (data !== null) {
          active.push({ slotIndex, agentSlot: data });
        }
      });
      return active;
    },
  });
};
