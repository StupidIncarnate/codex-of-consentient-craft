/**
 * PURPOSE: React hook that manages agent output state per execution slot with append and clear operations
 *
 * USAGE:
 * const {slotOutputs, handleAgentOutput, clearOutput} = useAgentOutputBinding();
 * // Returns {slotOutputs: Map<SlotIndex, AgentOutputLine[]>, handleAgentOutput: Function, clearOutput: Function}
 */
import { useCallback, useState } from 'react';

import type { AgentOutputLine } from '../../contracts/agent-output-line/agent-output-line-contract';
import type { SlotIndex } from '../../contracts/slot-index/slot-index-contract';
import { agentOutputState } from '../../state/agent-output/agent-output-state';

export const useAgentOutputBinding = (): {
  slotOutputs: Map<SlotIndex, AgentOutputLine[]>;
  handleAgentOutput: (params: { slotIndex: SlotIndex; lines: AgentOutputLine[] }) => void;
  clearOutput: () => void;
} => {
  const [slotOutputs, setSlotOutputs] = useState<Map<SlotIndex, AgentOutputLine[]>>(new Map());

  const handleAgentOutput = useCallback(
    ({ slotIndex, lines }: { slotIndex: SlotIndex; lines: AgentOutputLine[] }): void => {
      agentOutputState.append({ slotIndex, lines });
      setSlotOutputs(agentOutputState.getAll());
    },
    [],
  );

  const clearOutput = useCallback((): void => {
    agentOutputState.clear();
    setSlotOutputs(new Map());
  }, []);

  return { slotOutputs, handleAgentOutput, clearOutput };
};
