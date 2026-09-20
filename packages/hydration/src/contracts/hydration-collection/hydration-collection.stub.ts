import type { StubArgument } from '@dungeonmaster/shared/@types';
import { hydrationCollectionContract } from './hydration-collection-contract';
import type { HydrationCollectionData } from './hydration-collection-contract';

export const HydrationCollectionStub = ({
  ...props
}: StubArgument<HydrationCollectionData> = {}): HydrationCollectionData =>
  hydrationCollectionContract.parse({
    ingredient: 'quest',
    ...props,
  });
