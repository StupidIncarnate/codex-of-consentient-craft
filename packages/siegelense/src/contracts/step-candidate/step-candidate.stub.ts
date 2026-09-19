import type { StubArgument } from '@dungeonmaster/shared/@types';

import { stepCandidateContract } from './step-candidate-contract';
import type { StepCandidate } from './step-candidate-contract';

export const StepCandidateStub = ({ ...props }: StubArgument<StepCandidate> = {}): StepCandidate =>
  stepCandidateContract.parse({
    index: 0,
    ref: 16,
    within: '[data-testid="GUILD_LIST"]',
    text: '+',
    rect: '(444,348) 27x25',
    ...props,
  });
