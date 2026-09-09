import type { StubArgument } from '@dungeonmaster/shared/@types';

import { elapsedPartsContract } from './elapsed-parts-contract';
import type { ElapsedParts } from './elapsed-parts-contract';

export const ElapsedPartsStub = ({ ...props }: StubArgument<ElapsedParts> = {}): ElapsedParts =>
  elapsedPartsContract.parse({
    hours: 0,
    minutes: 0,
    seconds: 0,
    ...props,
  });
