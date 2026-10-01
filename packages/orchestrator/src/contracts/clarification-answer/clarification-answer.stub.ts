import type { StubArgument } from '@dungeonmaster/shared/@types';

import { clarificationAnswerContract } from './clarification-answer-contract';
import type { ClarificationAnswer } from './clarification-answer-contract';

export const ClarificationAnswerStub = ({
  ...props
}: StubArgument<ClarificationAnswer> = {}): ClarificationAnswer =>
  clarificationAnswerContract.parse({
    header: 'Architecture Choice',
    labels: ['Option A'],
    ...props,
  });
