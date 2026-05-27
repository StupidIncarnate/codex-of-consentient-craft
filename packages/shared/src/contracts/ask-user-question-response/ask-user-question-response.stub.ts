import type { StubArgument } from '@dungeonmaster/shared/@types';

import { askUserQuestionResponseContract } from './ask-user-question-response-contract';
import type { AskUserQuestionResponse } from './ask-user-question-response-contract';

export const AskUserQuestionResponseStub = ({
  ...props
}: StubArgument<AskUserQuestionResponse> = {}): AskUserQuestionResponse =>
  askUserQuestionResponseContract.parse({
    questions: [
      {
        question: 'Which option do you prefer?',
        header: 'Preference',
        options: [{ label: 'Option A', description: 'First option' }],
        multiSelect: false,
      },
    ],
    answers: { 'Which option do you prefer?': 'Option A' },
    ...props,
  });
