import type { StubArgument } from '@dungeonmaster/shared/@types';

import { keyReadingContract } from './key-reading-contract';
import type { KeyReading } from './key-reading-contract';

export const KeyReadingStub = ({ ...props }: StubArgument<KeyReading> = {}): KeyReading =>
  keyReadingContract.parse({
    rows: [],
    highestRef: 0,
    skipped: [],
    ...props,
  });
