import type { StubArgument } from '@dungeonmaster/shared/@types';
import { SessionIdStub, StepIdStub } from '@dungeonmaster/shared/contracts';

import { AgentSpawnStreamingResultStub } from '../agent-spawn-streaming-result/agent-spawn-streaming-result.stub';
import { SlotIndexStub } from '../slot-index/slot-index.stub';
import { activeAgentContract } from './active-agent-contract';
import type { ActiveAgent } from './active-agent-contract';

export const ActiveAgentStub = ({ ...props }: StubArgument<ActiveAgent> = {}): ActiveAgent =>
  activeAgentContract.parse({
    slotIndex: SlotIndexStub(),
    stepId: StepIdStub(),
    sessionId: SessionIdStub(),
    promise: Promise.resolve(AgentSpawnStreamingResultStub()),
    ...props,
  });
