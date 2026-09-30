import type { StubArgument } from '@dungeonmaster/shared/@types';

import { resetReadingContract } from './reset-reading-contract';
import type { ResetReading } from './reset-reading-contract';
import { ResetUndidStub } from '../reset-undid/reset-undid.stub';

export const ResetReadingStub = ({ ...props }: StubArgument<ResetReading> = {}): ResetReading =>
  resetReadingContract.parse({
    restored: 'clean',
    undid: ResetUndidStub(),
    NOT_cleared: ['server memory', 'open websockets'],
    ...props,
  });
