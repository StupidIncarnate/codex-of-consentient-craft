import type { StubArgument } from '@dungeonmaster/shared/@types';
import { ContentTextStub } from '@dungeonmaster/shared/contracts/content-text/content-text.stub';

import { resetReadingContract } from './reset-reading-contract';
import type { ResetReading } from './reset-reading-contract';
import { ResetUndidStub } from '../reset-undid/reset-undid.stub';

export const ResetReadingStub = ({ ...props }: StubArgument<ResetReading> = {}): ResetReading =>
  resetReadingContract.parse({
    restored: ContentTextStub({ value: 'clean' }),
    undid: ResetUndidStub(),
    NOT_cleared: [
      ContentTextStub({ value: 'server memory' }),
      ContentTextStub({ value: 'open websockets' }),
    ],
    ...props,
  });
