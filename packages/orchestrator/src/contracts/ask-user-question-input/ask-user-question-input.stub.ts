import type { StubArgument } from '@dungeonmaster/shared/@types';

import { ClarificationQuestionStub } from '../clarification-question/clarification-question.stub';
import { askUserQuestionInputContract } from './ask-user-question-input-contract';
import type { AskUserQuestionInput } from './ask-user-question-input-contract';

export const AskUserQuestionInputStub = ({
  ...props
}: StubArgument<AskUserQuestionInput> = {}): AskUserQuestionInput =>
  askUserQuestionInputContract.parse({
    questions: [ClarificationQuestionStub()],
    ...props,
  });
