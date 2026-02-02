import { agentSlotsState } from './agent-slots-state';
import type { SlotCountStub } from '../../contracts/slot-count/slot-count.stub';
import type { SlotDataStub } from '../../contracts/slot-data/slot-data.stub';
import type { SlotIndexStub } from '../../contracts/slot-index/slot-index.stub';

type SlotCount = ReturnType<typeof SlotCountStub>;
type SlotData = ReturnType<typeof SlotDataStub>;
type SlotIndex = ReturnType<typeof SlotIndexStub>;

export const agentSlotsStateProxy = (): {
  setupSlotAssigned: (params: { slotId: SlotIndex; data: SlotData; slotCount: SlotCount }) => void;
  setupEmptySlots: (params: { slotCount: SlotCount }) => void;
  setupUninitialized: () => void;
} => ({
  setupSlotAssigned: ({
    slotId,
    data,
    slotCount,
  }: {
    slotId: SlotIndex;
    data: SlotData;
    slotCount: SlotCount;
  }): void => {
    agentSlotsState.clear();
    agentSlotsState.initialize({ slotCount });
    agentSlotsState.assignSlot({ slotId, data });
  },

  setupEmptySlots: ({ slotCount }: { slotCount: SlotCount }): void => {
    agentSlotsState.clear();
    agentSlotsState.initialize({ slotCount });
  },

  setupUninitialized: (): void => {
    agentSlotsState.clear();
  },
});
