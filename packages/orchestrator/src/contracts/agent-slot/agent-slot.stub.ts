import type { StubArgument } from '@dungeonmaster/shared/@types';

import { agentSlotContract } from './agent-slot-contract';
import type { AgentSlot } from './agent-slot-contract';

export const AgentSlotStub = ({ ...props }: StubArgument<AgentSlot> = {}): AgentSlot =>
  agentSlotContract.parse({
    stepId: 'create-login-api',
    sessionId: 'session-test-123',
    process: {
      kill: () => true,
      waitForExit: async () => Promise.resolve(),
    },
    startedAt: '2024-01-15T10:00:00.000Z',
    ...props,
  });
