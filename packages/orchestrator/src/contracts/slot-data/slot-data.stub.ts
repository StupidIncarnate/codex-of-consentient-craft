import type { StubArgument } from '@dungeonmaster/shared/@types';

import { slotDataContract } from './slot-data-contract';
import type { SlotData } from './slot-data-contract';

export const SlotDataStub = ({ ...props }: StubArgument<SlotData> = {}): SlotData =>
  slotDataContract.parse({
    stepId: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
    sessionId: 'session-123',
    startedAt: '2024-01-15T10:00:00.000Z',
    ...props,
  });
