import type { z } from '#gateway/npm/zod';

import { stopOnContract } from './stop-on-contract';
import type { StopOn } from './stop-on-contract';

type StopOnInput = z.input<typeof stopOnContract>;

export const StopOnStub = ({ value }: { value?: StopOnInput } = {}): StopOn =>
  stopOnContract.parse(value ?? 'error');
