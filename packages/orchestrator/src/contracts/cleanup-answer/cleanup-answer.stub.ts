import type { StubArgument } from '@dungeonmaster/shared/@types';

import { cleanupAnswerContract } from './cleanup-answer-contract';
import type { CleanupCliAnswer } from './cleanup-answer-contract';

export const CleanupCliAnswerStub = ({
  ...props
}: StubArgument<CleanupCliAnswer> = {}): CleanupCliAnswer =>
  cleanupAnswerContract.parse({
    reaped: [],
    portsReleased: [],
    lockReleased: false,
    assetsAged: { instances: 0 },
    ...props,
  });
