import type { StubArgument } from '@dungeonmaster/shared/@types';

import { agentSlotContract } from './agent-slot-contract';
import type { AgentSlot } from './agent-slot-contract';

export const AgentSlotStub = ({ ...props }: StubArgument<AgentSlot> = {}): AgentSlot =>
  agentSlotContract.parse({
    stepId: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
    sessionId: 'session-test-123',
    process: {
      kill: () => true,
      waitForExit: async () => Promise.resolve(),
    },
    startedAt: '2024-01-15T10:00:00.000Z',
    ...props,
  });
