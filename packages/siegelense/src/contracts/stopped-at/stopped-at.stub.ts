import type { StubArgument } from '@dungeonmaster/shared/@types';
import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { StepCandidateStub } from '../step-candidate/step-candidate.stub';
import { StepIndexStub } from '../step-index/step-index.stub';
import { StepVerbStub } from '../step-verb/step-verb.stub';
import { stoppedAtContract } from './stopped-at-contract';
import type { StoppedAt } from './stopped-at-contract';

export const StoppedAtStub = ({ ...props }: StubArgument<StoppedAt> = {}): StoppedAt =>
  stoppedAtContract.parse({
    step: StepIndexStub({ value: 4 }),
    verb: StepVerbStub({ value: 'click' }),
    error: ContentTextStub({ value: 'AMBIGUOUS: 2 elements match [data-testid="PIXEL_BTN"]' }),
    candidates: [StepCandidateStub()],
    ...props,
  });
