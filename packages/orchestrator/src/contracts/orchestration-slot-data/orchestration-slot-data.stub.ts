import type { StubArgument } from '@dungeonmaster/shared/@types';

import { orchestrationSlotDataContract } from './orchestration-slot-data-contract';
import type { OrchestrationSlotData } from './orchestration-slot-data-contract';

export const OrchestrationSlotDataStub = ({
  ...props
}: StubArgument<OrchestrationSlotData> = {}): OrchestrationSlotData =>
  orchestrationSlotDataContract.parse({
    slotIndex: 0,
    status: 'idle',
    ...props,
  });
