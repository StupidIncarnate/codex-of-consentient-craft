import type { StubArgument } from '@dungeonmaster/shared/@types';
import { hydrationRunStateContract } from './hydration-run-state-contract';
import type { HydrationRunState } from './hydration-run-state-contract';

export const HydrationRunStateStub = ({
  ...props
}: StubArgument<HydrationRunState> = {}): HydrationRunState => {
  const { records, saved, ...dataProps } = props;

  return {
    ...hydrationRunStateContract.parse({
      recipeName: 'guild-mid-execution',
      ...dataProps,
    }),
    records: (records ?? new Map()) as HydrationRunState['records'],
    saved: (saved ?? new Map()) as HydrationRunState['saved'],
  };
};
