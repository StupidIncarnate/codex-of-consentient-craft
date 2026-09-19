import type { StubArgument } from '@dungeonmaster/shared/@types';

import { refResolutionContract } from './ref-resolution-contract';
import type { RefResolution } from './ref-resolution-contract';

export const RefResolutionStub = ({ ...props }: StubArgument<RefResolution> = {}): RefResolution =>
  refResolutionContract.parse({
    state: 'live',
    boundary: null,
    highestMinted: 0,
    ...props,
  });
