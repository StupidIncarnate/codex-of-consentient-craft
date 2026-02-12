import type { AgentOutputLineStub } from '../../contracts/agent-output-line/agent-output-line.stub';
import type { ProcessIdStub } from '../../contracts/process-id/process-id.stub';
import type { SlotIndexStub } from '../../contracts/slot-index/slot-index.stub';

import { agentOutputBufferState } from './agent-output-buffer-state';

type AgentOutputLine = ReturnType<typeof AgentOutputLineStub>;
type ProcessId = ReturnType<typeof ProcessIdStub>;
type SlotIndex = ReturnType<typeof SlotIndexStub>;

export const agentOutputBufferStateProxy = (): {
  setupEmpty: () => void;
  setupWithLines: (params: {
    processId: ProcessId;
    slotIndex: SlotIndex;
    lines: AgentOutputLine[];
  }) => void;
} => ({
  setupEmpty: (): void => {
    agentOutputBufferState.clear();
  },

  setupWithLines: ({
    processId,
    slotIndex,
    lines,
  }: {
    processId: ProcessId;
    slotIndex: SlotIndex;
    lines: AgentOutputLine[];
  }): void => {
    agentOutputBufferState.clear();
    for (const line of lines) {
      agentOutputBufferState.addLine({ processId, slotIndex, line });
    }
  },
});
