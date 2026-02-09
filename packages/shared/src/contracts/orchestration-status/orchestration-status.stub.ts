import type { StubArgument } from '@dungeonmaster/shared/@types';

import { orchestrationStatusContract } from './orchestration-status-contract';
import type { OrchestrationStatus } from './orchestration-status-contract';

export const OrchestrationStatusStub = ({
  ...props
}: StubArgument<OrchestrationStatus> = {}): OrchestrationStatus =>
  orchestrationStatusContract.parse({
    processId: 'proc-12345',
    questId: 'add-auth',
    phase: 'idle',
    completed: 0,
    total: 5,
    slots: [],
    ...props,
  });
