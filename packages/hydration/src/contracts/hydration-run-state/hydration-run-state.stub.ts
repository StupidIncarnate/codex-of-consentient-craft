import type { StubArgument } from '@dungeonmaster/shared/@types';
import { hydrationRunStateContract } from './hydration-run-state-contract';
import type { HydrationRunState } from './hydration-run-state-contract';

export const HydrationRunStateStub = ({
  ...props
}: StubArgument<HydrationRunState> = {}): HydrationRunState =>
  hydrationRunStateContract.parse({
    recipeName: 'guild-mid-execution',
    records: new Map(),
    saved: new Map(),
    ...props,
  });
