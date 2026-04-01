import {
  GuildIdStub,
  ProcessIdStub,
  QuestIdStub,
  SessionIdStub,
} from '@dungeonmaster/shared/contracts';
import { SessionClarifyResponder } from './session-clarify-responder';
import { SessionClarifyResponderProxy } from './session-clarify-responder.proxy';

describe('SessionClarifyResponder', () => {
  describe('successful clarification', () => {
    it('VALID: {sessionId, guildId, questId, answers, questions} => returns 200 with chatProcessId', async () => {
      const proxy = SessionClarifyResponderProxy();
      const chatProcessId = ProcessIdStub({ value: 'clarify-proc-123' });
      proxy.setupClarify({ chatProcessId });

      const result = await proxy.callResponder({
        params: { sessionId: SessionIdStub() },
        body: {
          guildId: GuildIdStub(),
          questId: QuestIdStub(),
          answers: [{ header: 'Database', label: 'PostgreSQL' }],
          questions: [
            {
              question: 'Which DB?',
              header: 'Database',
              options: [{ label: 'PostgreSQL', description: 'Relational DB' }],
              multiSelect: false,
            },
          ],
        },
      });

      expect(result).toStrictEqual({
        status: 200,
        data: { chatProcessId: 'clarify-proc-123' },
      });
    });
  });

  describe('validation errors', () => {
    it('INVALID: {null params} => returns 400', async () => {
      SessionClarifyResponderProxy();

      const result = await SessionClarifyResponder({
        params: null,
        body: {},
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Invalid params' },
      });
    });

    it('INVALID: {non-object params} => returns 400', async () => {
      SessionClarifyResponderProxy();

      const result = await SessionClarifyResponder({
        params: 'not-an-object' as never,
        body: {},
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Invalid params' },
      });
    });

    it('INVALID: {missing sessionId} => returns 400', async () => {
      SessionClarifyResponderProxy();

      const result = await SessionClarifyResponder({
        params: {},
        body: {},
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'sessionId is required' },
      });
    });

    it('INVALID: {null body} => returns 400', async () => {
      SessionClarifyResponderProxy();

      const result = await SessionClarifyResponder({
        params: { sessionId: SessionIdStub() },
        body: null,
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Request body must be a JSON object' },
      });
    });

    it('INVALID: {missing guildId} => returns 400', async () => {
      SessionClarifyResponderProxy();

      const result = await SessionClarifyResponder({
        params: { sessionId: SessionIdStub() },
        body: { questId: QuestIdStub(), answers: [{ header: 'x', label: 'y' }], questions: [] },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'guildId is required' },
      });
    });

    it('INVALID: {missing questId} => returns 400', async () => {
      SessionClarifyResponderProxy();

      const result = await SessionClarifyResponder({
        params: { sessionId: SessionIdStub() },
        body: { guildId: GuildIdStub(), answers: [{ header: 'x', label: 'y' }], questions: [] },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'questId is required' },
      });
    });

    it('INVALID: {answers is not an array} => returns 400', async () => {
      SessionClarifyResponderProxy();

      const result = await SessionClarifyResponder({
        params: { sessionId: SessionIdStub() },
        body: {
          guildId: GuildIdStub(),
          questId: QuestIdStub(),
          answers: 'not-an-array' as never,
          questions: [],
        },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'answers array is required and must not be empty' },
      });
    });

    it('INVALID: {empty answers array} => returns 400', async () => {
      SessionClarifyResponderProxy();

      const result = await SessionClarifyResponder({
        params: { sessionId: SessionIdStub() },
        body: { guildId: GuildIdStub(), questId: QuestIdStub(), answers: [], questions: [] },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'answers array is required and must not be empty' },
      });
    });

    it('INVALID: {missing questions} => returns 400', async () => {
      SessionClarifyResponderProxy();

      const result = await SessionClarifyResponder({
        params: { sessionId: SessionIdStub() },
        body: {
          guildId: GuildIdStub(),
          questId: QuestIdStub(),
          answers: [{ header: 'x', label: 'y' }],
        },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'questions array is required' },
      });
    });
  });

  describe('error handling', () => {
    it('ERROR: {orchestrator throws} => returns 500', async () => {
      const proxy = SessionClarifyResponderProxy();
      proxy.setupError({ message: 'Orchestrator down' });

      const result = await proxy.callResponder({
        params: { sessionId: SessionIdStub() },
        body: {
          guildId: GuildIdStub(),
          questId: QuestIdStub(),
          answers: [{ header: 'Database', label: 'PostgreSQL' }],
          questions: [
            {
              question: 'Which DB?',
              header: 'Database',
              options: [{ label: 'PostgreSQL', description: 'Relational DB' }],
              multiSelect: false,
            },
          ],
        },
      });

      expect(result).toStrictEqual({
        status: 500,
        data: { error: 'Orchestrator down' },
      });
    });

    it('ERROR: {orchestrator throws with string message} => returns 500 with error message', async () => {
      const proxy = SessionClarifyResponderProxy();
      proxy.setupNonErrorThrow();

      const result = await proxy.callResponder({
        params: { sessionId: SessionIdStub() },
        body: {
          guildId: GuildIdStub(),
          questId: QuestIdStub(),
          answers: [{ header: 'Database', label: 'PostgreSQL' }],
          questions: [
            {
              question: 'Which DB?',
              header: 'Database',
              options: [{ label: 'PostgreSQL', description: 'Relational DB' }],
              multiSelect: false,
            },
          ],
        },
      });

      expect(result).toStrictEqual({
        status: 500,
        data: { error: 'string-not-error-instance' },
      });
    });
  });
});
