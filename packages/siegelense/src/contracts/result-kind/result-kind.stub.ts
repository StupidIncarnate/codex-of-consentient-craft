import type { z } from 'zod';

import { resultKindContract } from './result-kind-contract';
import type { ResultKind } from './result-kind-contract';

type ResultKindInput = z.input<typeof resultKindContract>;

export const ResultKindStub = ({ value }: { value?: ResultKindInput } = {}): ResultKind =>
  resultKindContract.parse(value ?? 'console');
