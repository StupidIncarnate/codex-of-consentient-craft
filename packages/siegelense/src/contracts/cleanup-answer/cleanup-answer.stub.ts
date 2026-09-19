import type { StubArgument } from '@dungeonmaster/shared/@types';

import { LeftAloneStub } from '../left-alone/left-alone.stub';
import { ReapedInstanceStub } from '../reaped-instance/reaped-instance.stub';
import { cleanupAnswerContract } from './cleanup-answer-contract';
import type { CleanupAnswer } from './cleanup-answer-contract';

export const CleanupAnswerStub = ({ ...props }: StubArgument<CleanupAnswer> = {}): CleanupAnswer =>
  cleanupAnswerContract.parse({
    reaped: [ReapedInstanceStub()],
    portsReleased: [41_345, 34_173],
    lockReleased: true,
    assetsAged: { instances: 3, freedMB: 1840 },
    leftAlone: [LeftAloneStub()],
    ...props,
  });
