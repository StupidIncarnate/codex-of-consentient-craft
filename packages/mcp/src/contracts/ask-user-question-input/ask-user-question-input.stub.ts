import type { StubArgument } from '@dungeonmaster/shared/@types';
import { askUserQuestionInputContract } from './ask-user-question-input-contract';
import type { AskUserQuestionInput } from './ask-user-question-input-contract';

export const AskUserQuestionInputStub = ({
  ...props
}: StubArgument<AskUserQuestionInput> = {}): AskUserQuestionInput =>
  askUserQuestionInputContract.parse({
    questions: [
      {
        question: 'Which approach do you prefer?',
        header: 'Design Choice',
        options: [
          { label: 'Option A', description: 'First approach' },
          { label: 'Option B', description: 'Second approach' },
        ],
        multiSelect: false,
      },
    ],
    ...props,
  });
