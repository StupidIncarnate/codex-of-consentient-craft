import type { StubArgument } from '@dungeonmaster/shared/@types';

import { cleanupAnswerContract } from './cleanup-answer-contract';
import type { CleanupAnswer } from './cleanup-answer-contract';

export const CleanupAnswerStub = ({ ...props }: StubArgument<CleanupAnswer> = {}): CleanupAnswer =>
  cleanupAnswerContract.parse({
    reaped: [],
    portsReleased: [],
    lockReleased: false,
    assetsAged: { instances: 0 },
    ...props,
  });
