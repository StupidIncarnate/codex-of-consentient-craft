import type { StubArgument } from '@dungeonmaster/shared/@types';

import { orchestrationSlotContract } from './orchestration-slot-contract';
import type { OrchestrationSlot } from './orchestration-slot-contract';

export const OrchestrationSlotStub = ({
  ...props
}: StubArgument<OrchestrationSlot> = {}): OrchestrationSlot =>
  orchestrationSlotContract.parse({
    slotId: 0,
    status: 'idle',
    ...props,
  });
