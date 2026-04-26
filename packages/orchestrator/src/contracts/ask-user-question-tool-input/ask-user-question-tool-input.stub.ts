import type { StubArgument } from '@dungeonmaster/shared/@types';

import { askUserQuestionToolInputContract } from './ask-user-question-tool-input-contract';
import type { AskUserQuestionToolInput } from './ask-user-question-tool-input-contract';

/**
 * Default stub — `questions` arrives as the JSON-encoded string Claude CLI emits.
 */
export const AskUserQuestionToolInputStub = ({
  ...props
}: StubArgument<AskUserQuestionToolInput> = {}): AskUserQuestionToolInput =>
  askUserQuestionToolInputContract.parse({
    questions: JSON.stringify([{ question: 'Pick one' }]),
    ...props,
  });
