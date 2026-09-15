import type { z } from 'zod';

import { stepExpectationContract } from './step-expectation-contract';
import type { StepExpectation } from './step-expectation-contract';

type StepExpectationInput = z.input<typeof stepExpectationContract>;

export const StepExpectationStub = ({
  value,
}: { value?: StepExpectationInput } = {}): StepExpectation =>
  stepExpectationContract.parse(value ?? 'ok');
