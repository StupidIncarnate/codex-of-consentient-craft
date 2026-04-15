import type { StubArgument } from '@dungeonmaster/shared/@types';

import { planningSynthesisContract } from './planning-synthesis-contract';
import type { PlanningSynthesis } from './planning-synthesis-contract';

export const PlanningSynthesisStub = ({
  ...props
}: StubArgument<PlanningSynthesis> = {}): PlanningSynthesis =>
  planningSynthesisContract.parse({
    orderOfOperations: '1. Set up contracts. 2. Wire adapters. 3. Build brokers.',
    crossSliceResolutions: 'Slices A and B share the session contract; A writes first.',
    claudemdRulesInEffect: [],
    openAssumptions: [],
    synthesizedAt: '2024-01-15T10:00:00.000Z',
    ...props,
  });
