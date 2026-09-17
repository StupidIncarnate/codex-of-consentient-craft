import type { StubArgument } from '@dungeonmaster/shared/@types';

import { capacitySuggestionContract } from './capacity-suggestion-contract';
import type { CapacitySuggestion } from './capacity-suggestion-contract';

export const CapacitySuggestionStub = ({
  ...props
}: StubArgument<CapacitySuggestion> = {}): CapacitySuggestion =>
  capacitySuggestionContract.parse({
    suggested: 2,
    ceiling: 3,
    memoryAllows: 2,
    ceilingLeft: 2,
    availableMB: 4808,
    ...props,
  });
