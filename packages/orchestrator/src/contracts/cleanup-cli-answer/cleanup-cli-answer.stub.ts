import type { StubArgument } from '@dungeonmaster/shared/@types';

import { cleanupCliAnswerContract } from './cleanup-cli-answer-contract';
import type { CleanupCliAnswer } from './cleanup-cli-answer-contract';

export const CleanupCliAnswerStub = ({
  ...props
}: StubArgument<CleanupCliAnswer> = {}): CleanupCliAnswer =>
  cleanupCliAnswerContract.parse({
    reaped: [],
    portsReleased: [],
    lockReleased: false,
    lockReleaseOutcome: 'none-held',
    assetsAged: { instances: 0 },
    ...props,
  });
