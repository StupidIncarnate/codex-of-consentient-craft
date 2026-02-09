import type { StubArgument } from '@dungeonmaster/shared/@types';

import { slotOperationsContract } from './slot-operations-contract';
import type { SlotOperations } from './slot-operations-contract';

export const SlotOperationsStub = ({
  ...props
}: StubArgument<SlotOperations> = {}): SlotOperations =>
  slotOperationsContract.parse({
    getAvailableSlot: () => 0,
    assignSlot: () => undefined,
    releaseSlot: () => true,
    getActiveSlots: () => [],
    ...props,
  });
