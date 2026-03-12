/**
 * PURPOSE: React hook that manages pre-parsed ChatEntry[] per execution slot
 *
 * USAGE:
 * const {slotEntries, handleAgentOutput, clearOutput} = useAgentOutputBinding();
 * // Returns {slotEntries: Map<SlotIndex, ChatEntry[]>, handleAgentOutput: Function, clearOutput: Function}
 */
import { useCallback, useState } from 'react';

import type { ChatEntry } from '../../contracts/chat-entry/chat-entry-contract';
import type { SlotIndex } from '../../contracts/slot-index/slot-index-contract';
import { agentOutputState } from '../../state/agent-output/agent-output-state';

export const useAgentOutputBinding = (): {
  slotEntries: Map<SlotIndex, ChatEntry[]>;
  handleAgentOutput: (params: { slotIndex: SlotIndex; entries: ChatEntry[] }) => void;
  clearOutput: () => void;
} => {
  const [slotEntries, setSlotEntries] = useState<Map<SlotIndex, ChatEntry[]>>(new Map());

  const handleAgentOutput = useCallback(
    ({ slotIndex, entries }: { slotIndex: SlotIndex; entries: ChatEntry[] }): void => {
      if (entries.length === 0) return;

      agentOutputState.append({ slotIndex, entries });
      setSlotEntries(agentOutputState.getAll());
    },
    [],
  );

  const clearOutput = useCallback((): void => {
    agentOutputState.clear();
    setSlotEntries(new Map());
  }, []);

  return { slotEntries, handleAgentOutput, clearOutput };
};
