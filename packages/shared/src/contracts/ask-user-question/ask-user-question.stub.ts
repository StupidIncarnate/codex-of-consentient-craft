import type { StubArgument } from '../../@types/stub-argument.type';

import { askUserQuestionContract } from './ask-user-question-contract';
import type { AskUserQuestion } from './ask-user-question-contract';

export const AskUserQuestionStub = ({
  ...props
}: StubArgument<AskUserQuestion> = {}): AskUserQuestion =>
  askUserQuestionContract.parse({
    questions: [
      {
        question: 'Which option do you prefer?',
        header: 'Preference',
        options: [{ label: 'Option A', description: 'First option' }],
        multiSelect: false,
      },
    ],
    ...props,
  });
