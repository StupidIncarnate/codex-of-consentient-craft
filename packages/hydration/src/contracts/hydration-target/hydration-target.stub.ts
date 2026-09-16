import type { StubArgument } from '@dungeonmaster/shared/@types';
import { hydrationTargetContract } from './hydration-target-contract';
import type { HydrationTarget } from './hydration-target-contract';

export const HydrationTargetStub = ({
  ...props
}: StubArgument<HydrationTarget> = {}): HydrationTarget =>
  hydrationTargetContract.parse({
    ...props,
  });
