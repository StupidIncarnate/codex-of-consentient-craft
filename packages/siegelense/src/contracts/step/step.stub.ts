import type { StubArgument } from '@dungeonmaster/shared/@types';

import { SelectorStub } from '../selector/selector.stub';
import { StepExpectationStub } from '../step-expectation/step-expectation.stub';
import { stepContract } from './step-contract';
import type { Step } from './step-contract';

export const StepStub = ({ ...props }: StubArgument<Step> = {}): Step =>
  stepContract.parse({
    step: 'click',
    target: SelectorStub(),
    within: null,
    timeoutMs: null,
    node: null,
    expect: StepExpectationStub(),
    ...props,
  });
