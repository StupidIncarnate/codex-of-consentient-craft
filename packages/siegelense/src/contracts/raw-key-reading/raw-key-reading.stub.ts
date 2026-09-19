import type { StubArgument } from '@dungeonmaster/shared/@types';

import { rawKeyReadingContract } from './raw-key-reading-contract';
import type { RawKeyReading } from './raw-key-reading-contract';

export const RawKeyReadingStub = ({ ...props }: StubArgument<RawKeyReading> = {}): RawKeyReading =>
  rawKeyReadingContract.parse({
    rows: [],
    highestRef: 0,
    skipped: [],
    ...props,
  });
