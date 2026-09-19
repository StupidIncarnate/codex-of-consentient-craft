import type { StubArgument } from '@dungeonmaster/shared/@types';
import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { keyReadingContract } from './key-reading-contract';
import type { KeyReading } from './key-reading-contract';

export const KeyReadingStub = ({ ...props }: StubArgument<KeyReading> = {}): KeyReading =>
  keyReadingContract.parse({
    press: ContentTextStub({ value: 'Enter' }),
    focused: null,
    ...props,
  });
