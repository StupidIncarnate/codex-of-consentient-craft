import { AskUserQuestionStub } from '@dungeonmaster/shared/contracts';

import { askUserQuestionBroker } from './ask-user-question-broker';
import { askUserQuestionBrokerProxy } from './ask-user-question-broker.proxy';

const WAIT_INSTRUCTION =
  "Questions sent to the user. Their answers will arrive as your next user message. Do NOT continue generating — wait for the session to resume with the user's response.";

describe('askUserQuestionBroker', () => {
  describe('valid input', () => {
    it('VALID: {questions} => returns the wait instruction', () => {
      askUserQuestionBrokerProxy();
      const input = AskUserQuestionStub();

      const result = askUserQuestionBroker({ input });

      expect(result).toBe(WAIT_INSTRUCTION);
    });
  });

  describe('invalid input', () => {
    it('INVALID: {questions: []} => throws (at least 1 required)', () => {
      askUserQuestionBrokerProxy();

      expect(() => askUserQuestionBroker({ input: { questions: [] } })).toThrow(/at least 1/u);
    });

    it('EMPTY: {} => throws (questions required)', () => {
      askUserQuestionBrokerProxy();

      expect(() => askUserQuestionBroker({ input: {} })).toThrow(/Required/u);
    });
  });
});
