import type { StubArgument } from '@dungeonmaster/shared/@types';

import { clarificationQuestionContract } from './clarification-question-contract';
import type { ClarificationQuestion } from './clarification-question-contract';

export const ClarificationQuestionStub = ({
  ...props
}: StubArgument<ClarificationQuestion> = {}): ClarificationQuestion =>
  clarificationQuestionContract.parse({
    question: 'Which approach do you prefer?',
    header: 'Architecture Choice',
    options: [
      { label: 'Option A', description: 'Use REST endpoints' },
      { label: 'Option B', description: 'Use GraphQL' },
    ],
    multiSelect: false,
    ...props,
  });
