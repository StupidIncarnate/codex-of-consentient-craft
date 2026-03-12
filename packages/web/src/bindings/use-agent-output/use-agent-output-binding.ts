/**
 * PURPOSE: React hook that parses raw agent output lines into ChatEntry[] and manages state per execution slot
 *
 * USAGE:
 * const {slotEntries, handleAgentOutput, clearOutput} = useAgentOutputBinding();
 * // Returns {slotEntries: Map<SlotIndex, ChatEntry[]>, handleAgentOutput: Function, clearOutput: Function}
 */
import { useCallback, useState } from 'react';

import type { AgentOutputLine } from '../../contracts/agent-output-line/agent-output-line-contract';
import type { ChatEntry } from '../../contracts/chat-entry/chat-entry-contract';
import type { SlotIndex } from '../../contracts/slot-index/slot-index-contract';
import { agentOutputState } from '../../state/agent-output/agent-output-state';
import { streamJsonToChatEntryTransformer } from '../../transformers/stream-json-to-chat-entry/stream-json-to-chat-entry-transformer';

export const useAgentOutputBinding = (): {
  slotEntries: Map<SlotIndex, ChatEntry[]>;
  handleAgentOutput: (params: { slotIndex: SlotIndex; lines: AgentOutputLine[] }) => void;
  clearOutput: () => void;
} => {
  const [slotEntries, setSlotEntries] = useState<Map<SlotIndex, ChatEntry[]>>(new Map());

  const handleAgentOutput = useCallback(
    ({ slotIndex, lines }: { slotIndex: SlotIndex; lines: AgentOutputLine[] }): void => {
      const allEntries: ChatEntry[] = [];

      for (const line of lines) {
        try {
          const { entries } = streamJsonToChatEntryTransformer({ line });
          allEntries.push(...entries);
        } catch {
          // Skip malformed lines
        }
      }

      if (allEntries.length > 0) {
        agentOutputState.append({ slotIndex, entries: allEntries });
      }
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
