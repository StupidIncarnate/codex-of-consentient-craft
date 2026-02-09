import type { StubArgument } from '@dungeonmaster/shared/@types';

import { slotManagerResultContract } from './slot-manager-result-contract';
import type { SlotManagerResult } from './slot-manager-result-contract';

export const SlotManagerResultStub = ({
  ...props
}: StubArgument<SlotManagerResult> = {}): SlotManagerResult =>
  slotManagerResultContract.parse({
    completed: true,
    ...props,
  });
