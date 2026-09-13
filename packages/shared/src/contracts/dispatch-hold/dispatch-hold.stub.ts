import type { StubArgument } from '@dungeonmaster/shared/@types';

import { dispatchHoldContract } from './dispatch-hold-contract';
import type { DispatchHold } from './dispatch-hold-contract';

export const DispatchHoldStub = ({ ...props }: StubArgument<DispatchHold> = {}): DispatchHold =>
  dispatchHoldContract.parse({
    reason: 'approaching-limit',
    window: 'seven-day',
    detail: '7d window at 93%',
    heldAt: '2026-09-13T04:49:29.242Z',
    resumeAt: '2026-09-13T06:00:00.000Z',
    ...props,
  });
