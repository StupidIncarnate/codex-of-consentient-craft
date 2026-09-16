import type { z } from 'zod';

import { stepVerbContract } from './step-verb-contract';
import type { StepVerb } from './step-verb-contract';

type StepVerbInput = z.input<typeof stepVerbContract>;

export const StepVerbStub = ({ value }: { value?: StepVerbInput } = {}): StepVerb =>
  stepVerbContract.parse(value ?? 'click');
