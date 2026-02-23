import { agentOutputBufferStateProxy } from '../../../state/agent-output-buffer/agent-output-buffer-state.proxy';
import { ProcessOutputResponder } from './process-output-responder';
import type { AgentOutputLineStub } from '../../../contracts/agent-output-line/agent-output-line.stub';
import type { ProcessIdStub } from '../../../contracts/process-id/process-id.stub';
import type { SlotIndexStub } from '../../../contracts/slot-index/slot-index.stub';

type AgentOutputLine = ReturnType<typeof AgentOutputLineStub>;
type ProcessId = ReturnType<typeof ProcessIdStub>;
type SlotIndex = ReturnType<typeof SlotIndexStub>;

export const ProcessOutputResponderProxy = (): {
  setupOutput: (params: {
    processId: ProcessId;
    slotIndex: SlotIndex;
    lines: AgentOutputLine[];
  }) => void;
  setupNoOutput: () => void;
  callResponder: typeof ProcessOutputResponder;
} => {
  const stateProxy = agentOutputBufferStateProxy();

  return {
    setupOutput: ({
      processId,
      slotIndex,
      lines,
    }: {
      processId: ProcessId;
      slotIndex: SlotIndex;
      lines: AgentOutputLine[];
    }): void => {
      stateProxy.setupWithLines({ processId, slotIndex, lines });
    },
    setupNoOutput: (): void => {
      stateProxy.setupEmpty();
    },
    callResponder: ProcessOutputResponder,
  };
};
