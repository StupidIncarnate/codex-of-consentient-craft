/**
 * PURPOSE: Validates ask-user-question input and returns a static instruction string
 *
 * USAGE:
 * const result = askUserQuestionBroker({ input: { questions: [...] } });
 * // Returns branded ContentText instructing the agent to wait for user response
 */
import { askUserQuestionInputContract } from '../../../contracts/ask-user-question-input/ask-user-question-input-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import { contentTextContract } from '../../../contracts/content-text/content-text-contract';

export const askUserQuestionBroker = ({ input }: { input: unknown }): ContentText => {
  askUserQuestionInputContract.parse(input);

  return contentTextContract.parse(
    "Questions sent to user. Their answers will arrive as your next user message. Do NOT continue generating \u2014 wait for the session to resume with the user's response.",
  );
};
