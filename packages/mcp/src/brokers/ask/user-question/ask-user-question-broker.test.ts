import { askUserQuestionBroker } from './ask-user-question-broker';
import { askUserQuestionBrokerProxy } from './ask-user-question-broker.proxy';
import { AskUserQuestionInputStub } from '../../../contracts/ask-user-question-input/ask-user-question-input.stub';

describe('askUserQuestionBroker', () => {
  describe('valid input', () => {
    it('VALID: {single question} => returns static instruction string', () => {
      askUserQuestionBrokerProxy();
      const input = AskUserQuestionInputStub();

      const result = askUserQuestionBroker({ input });

      expect(result).toBe(
        "Questions sent to user. Their answers will arrive as your next user message. Do NOT continue generating \u2014 wait for the session to resume with the user's response.",
      );
    });

    it('VALID: {multiple questions} => returns same static instruction string', () => {
      askUserQuestionBrokerProxy();
      const input = AskUserQuestionInputStub({
        questions: [
          {
            question: 'First?',
            header: 'H1',
            options: [{ label: 'A', description: 'a' }],
            multiSelect: false,
          },
          {
            question: 'Second?',
            header: 'H2',
            options: [{ label: 'B', description: 'b' }],
            multiSelect: true,
          },
        ],
      });

      const result = askUserQuestionBroker({ input });

      expect(result).toBe(
        "Questions sent to user. Their answers will arrive as your next user message. Do NOT continue generating \u2014 wait for the session to resume with the user's response.",
      );
    });
  });

  describe('invalid input', () => {
    it('ERROR: {empty questions array} => throws validation error', () => {
      askUserQuestionBrokerProxy();

      expect(() => askUserQuestionBroker({ input: { questions: [] } as never })).toThrow(
        /too_small/u,
      );
    });

    it('ERROR: {missing questions} => throws validation error', () => {
      askUserQuestionBrokerProxy();

      expect(() => askUserQuestionBroker({ input: {} as never })).toThrow(/Required/u);
    });

    it('ERROR: {empty question text} => throws validation error', () => {
      askUserQuestionBrokerProxy();

      expect(() =>
        askUserQuestionBroker({
          input: {
            questions: [
              {
                question: '',
                header: 'Test',
                options: [],
                multiSelect: false,
              },
            ],
          } as never,
        }),
      ).toThrow(/too_small/u);
    });
  });
});
