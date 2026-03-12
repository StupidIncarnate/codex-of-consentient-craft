import type { ChatEntry } from '../../contracts/chat-entry/chat-entry-contract';
import type { SlotIndex } from '../../contracts/slot-index/slot-index-contract';

import { agentOutputState } from './agent-output-state';

export const agentOutputStateProxy = (): {
  setupSlotOutput: (params: { slotIndex: SlotIndex; entries: ChatEntry[] }) => void;
  setupEmptyOutput: () => void;
} => ({
  setupSlotOutput: ({
    slotIndex,
    entries,
  }: {
    slotIndex: SlotIndex;
    entries: ChatEntry[];
  }): void => {
    agentOutputState.append({ slotIndex, entries });
  },

  setupEmptyOutput: (): void => {
    agentOutputState.clear();
  },
});
