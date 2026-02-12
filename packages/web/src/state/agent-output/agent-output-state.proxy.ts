import type { AgentOutputLineStub } from '../../contracts/agent-output-line/agent-output-line.stub';
import type { SlotIndexStub } from '../../contracts/slot-index/slot-index.stub';

import { agentOutputState } from './agent-output-state';

type AgentOutputLine = ReturnType<typeof AgentOutputLineStub>;
type SlotIndex = ReturnType<typeof SlotIndexStub>;

export const agentOutputStateProxy = (): {
  setupSlotOutput: (params: { slotIndex: SlotIndex; lines: AgentOutputLine[] }) => void;
  setupEmptyOutput: () => void;
} => ({
  setupSlotOutput: ({
    slotIndex,
    lines,
  }: {
    slotIndex: SlotIndex;
    lines: AgentOutputLine[];
  }): void => {
    agentOutputState.append({ slotIndex, lines });
  },

  setupEmptyOutput: (): void => {
    agentOutputState.clear();
  },
});
