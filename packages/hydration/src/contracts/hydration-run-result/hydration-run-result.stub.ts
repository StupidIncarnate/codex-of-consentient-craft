import type { StubArgument } from '@dungeonmaster/shared/@types';
import { hydrationRunResultContract } from './hydration-run-result-contract';
import type { HydrationRunResult } from './hydration-run-result-contract';

export const HydrationRunResultStub = ({
  ...props
}: StubArgument<HydrationRunResult> = {}): HydrationRunResult =>
  hydrationRunResultContract.parse({
    ...props,
  });
