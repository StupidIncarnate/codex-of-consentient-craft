import type { StubArgument } from '@dungeonmaster/shared/@types';

import { dispatchStateContract } from './dispatch-state-contract';
import type { DispatchState } from './dispatch-state-contract';

export const DispatchStateStub = ({ ...props }: StubArgument<DispatchState> = {}): DispatchState =>
  dispatchStateContract.parse({
    mode: 'paused',
    updatedAt: '2024-01-15T10:00:00.000Z',
    ...props,
  });
