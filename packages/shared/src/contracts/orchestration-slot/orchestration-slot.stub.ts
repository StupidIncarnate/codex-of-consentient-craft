import type { StubArgument } from '../../@types/stub-argument.type';

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
