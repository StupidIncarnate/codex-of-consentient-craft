import type { StubArgument } from '@dungeonmaster/shared/@types';

import { loadCapacitySuggestionContract } from './load-capacity-suggestion-contract';
import type { LoadCapacitySuggestion } from './load-capacity-suggestion-contract';

export const LoadCapacitySuggestionStub = ({
  ...props
}: StubArgument<LoadCapacitySuggestion> = {}): LoadCapacitySuggestion =>
  loadCapacitySuggestionContract.parse({
    suggestion: 4,
    cpuLimit: 4,
    freeMemoryLimit: 8,
    capMemoryLimit: 6,
    ...props,
  });
