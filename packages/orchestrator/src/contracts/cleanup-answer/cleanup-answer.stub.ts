import type { StubArgument } from '@dungeonmaster/shared/@types';

import { cleanupCliAnswerContract } from './cleanup-answer-contract';
import type { CleanupCliAnswer } from './cleanup-answer-contract';

export const CleanupCliAnswerStub = ({ ...props }: StubArgument<CleanupCliAnswer> = {}): CleanupCliAnswer =>
  cleanupCliAnswerContract.parse({
    reaped: [],
    portsReleased: [],
    lockReleased: false,
    assetsAged: { instances: 0 },
    ...props,
  });
