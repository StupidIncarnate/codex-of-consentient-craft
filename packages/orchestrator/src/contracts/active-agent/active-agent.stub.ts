import type { StubArgument } from '@dungeonmaster/shared/@types';
import { SessionIdStub } from '@dungeonmaster/shared/contracts';

import { AgentSpawnStreamingResultStub } from '../agent-spawn-streaming-result/agent-spawn-streaming-result.stub';
import { SlotIndexStub } from '../slot-index/slot-index.stub';
import { WorkItemIdStub } from '../work-item-id/work-item-id.stub';
import { activeAgentContract } from './active-agent-contract';
import type { ActiveAgent } from './active-agent-contract';

export const ActiveAgentStub = ({ ...props }: StubArgument<ActiveAgent> = {}): ActiveAgent =>
  activeAgentContract.parse({
    slotIndex: SlotIndexStub(),
    workItemId: WorkItemIdStub(),
    sessionId: SessionIdStub(),
    followupDepth: 0,
    crashRetries: 0,
    promise: Promise.resolve(AgentSpawnStreamingResultStub()),
    ...props,
  });
