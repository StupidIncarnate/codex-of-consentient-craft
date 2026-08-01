import { AskUserQuestionStub } from '@dungeonmaster/shared/contracts';

import { askUserQuestionBroker } from './ask-user-question-broker';
import { askUserQuestionBrokerProxy } from './ask-user-question-broker.proxy';

const ROUTING_INSTRUCTION = [
  'Questions sent to the user.',
  "If you are an INTERACTIVE session (you were started by a slash command or a chat, and you have no work item): their answers arrive as your next user message. Do NOT continue generating — stop here and wait for the session to resume with the user's response.",
  'If you are a DISPATCHED WORK-ITEM agent (you fetched your prompt with get-agent-prompt and a workItemId): nothing will resume you, so do NOT wait. Record the question and the fact that it is outstanding in your handoff, keep working through the rest of your prompt, and finish your turn with signal-back as normal.',
].join(' ');

describe('askUserQuestionBroker', () => {
  describe('valid input', () => {
    it('VALID: {questions} => returns the routing instruction', () => {
      askUserQuestionBrokerProxy();
      const input = AskUserQuestionStub();

      const result = askUserQuestionBroker({ input });

      expect(result).toBe(ROUTING_INSTRUCTION);
    });

    it('VALID: {questions} => tells a dispatched work-item agent NOT to wait, so it still signals back', () => {
      askUserQuestionBrokerProxy();
      const input = AskUserQuestionStub();

      const result = askUserQuestionBroker({ input });

      expect({
        namesDispatchedCaller: String(result).includes('DISPATCHED WORK-ITEM agent'),
        tellsItNotToWait: String(result).includes('nothing will resume you, so do NOT wait'),
        tellsItToSignalBack: String(result).includes('finish your turn with signal-back'),
      }).toStrictEqual({
        namesDispatchedCaller: true,
        tellsItNotToWait: true,
        tellsItToSignalBack: true,
      });
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
