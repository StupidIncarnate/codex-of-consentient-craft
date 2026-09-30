import type { ChatEntry } from '@dungeonmaster/shared/contracts';

import { agentOutputState } from './agent-output-state';

export const agentOutputStateProxy = (): {
  setupSlotOutput: (params: { slotIndex: number; entries: ChatEntry[] }) => void;
  setupEmptyOutput: () => void;
} => ({
  setupSlotOutput: ({ slotIndex, entries }: { slotIndex: number; entries: ChatEntry[] }): void => {
    agentOutputState.append({ slotIndex, entries });
  },

  setupEmptyOutput: (): void => {
    agentOutputState.clear();
  },
});
