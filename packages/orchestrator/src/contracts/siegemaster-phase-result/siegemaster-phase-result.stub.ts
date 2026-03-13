import type { StubArgument } from '@dungeonmaster/shared/@types';

import { siegemasterPhaseResultContract } from './siegemaster-phase-result-contract';
import type { SiegemasterPhaseResult } from './siegemaster-phase-result-contract';

export const SiegemasterPhaseResultStub = ({
  ...props
}: StubArgument<SiegemasterPhaseResult> = {}): SiegemasterPhaseResult =>
  siegemasterPhaseResultContract.parse({
    failedObservableIds: [],
    ...props,
  });
