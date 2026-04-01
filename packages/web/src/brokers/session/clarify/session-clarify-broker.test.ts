import {
  GuildIdStub,
  ProcessIdStub,
  QuestIdStub,
  SessionIdStub,
} from '@dungeonmaster/shared/contracts';
import { sessionClarifyBroker } from './session-clarify-broker';
import { sessionClarifyBrokerProxy } from './session-clarify-broker.proxy';

describe('sessionClarifyBroker', () => {
  describe('successful clarification', () => {
    it('VALID: {sessionId, guildId, questId, answers, questions} => returns chatProcessId', async () => {
      const proxy = sessionClarifyBrokerProxy();
      const chatProcessId = ProcessIdStub({ value: 'clarify-proc-abc' });
      proxy.setupClarify({ chatProcessId });

      const result = await sessionClarifyBroker({
        sessionId: SessionIdStub(),
        guildId: GuildIdStub(),
        questId: QuestIdStub(),
        answers: [{ header: 'Database', label: 'PostgreSQL' }],
        questions: [
          {
            question: 'Which DB?' as never,
            header: 'Database' as never,
            options: [{ label: 'PostgreSQL' as never, description: 'Relational DB' as never }],
            multiSelect: false,
          },
        ],
      });

      expect(result).toStrictEqual({ chatProcessId: 'clarify-proc-abc' });
    });
  });

  describe('url construction', () => {
    it('VALID: {sessionId: "session-xyz-123"} => hits sessionClarify route with sessionId replaced', async () => {
      const proxy = sessionClarifyBrokerProxy();
      const chatProcessId = ProcessIdStub({ value: 'proc-url-test' });
      proxy.setupClarify({ chatProcessId });

      const result = await sessionClarifyBroker({
        sessionId: SessionIdStub({ value: 'session-xyz-123' }),
        guildId: GuildIdStub(),
        questId: QuestIdStub(),
        answers: [{ header: 'Framework', label: 'React' }],
        questions: [
          {
            question: 'Which framework?' as never,
            header: 'Framework' as never,
            options: [{ label: 'React' as never, description: 'UI library' as never }],
            multiSelect: false,
          },
        ],
      });

      expect(result).toStrictEqual({ chatProcessId: 'proc-url-test' });
    });
  });

  describe('body construction', () => {
    it('VALID: {guildId, questId, answers, questions} => sends all fields in request body', async () => {
      const proxy = sessionClarifyBrokerProxy();
      const chatProcessId = ProcessIdStub({ value: 'proc-body-test' });
      proxy.setupClarify({ chatProcessId });

      const guildId = GuildIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const questId = QuestIdStub({ value: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' });

      const result = await sessionClarifyBroker({
        sessionId: SessionIdStub(),
        guildId,
        questId,
        answers: [{ header: 'Database', label: 'PostgreSQL' }],
        questions: [
          {
            question: 'Which DB?' as never,
            header: 'Database' as never,
            options: [{ label: 'PostgreSQL' as never, description: 'Relational DB' as never }],
            multiSelect: false,
          },
        ],
      });

      expect(result).toStrictEqual({ chatProcessId: 'proc-body-test' });
    });
  });

  describe('response parsing', () => {
    it('INVALID: {chatProcessId: empty string} => throws parse error', async () => {
      const proxy = sessionClarifyBrokerProxy();
      proxy.setupInvalidResponse({ chatProcessId: '' });

      await expect(
        sessionClarifyBroker({
          sessionId: SessionIdStub(),
          guildId: GuildIdStub(),
          questId: QuestIdStub(),
          answers: [{ header: 'Database', label: 'PostgreSQL' }],
          questions: [
            {
              question: 'Which DB?' as never,
              header: 'Database' as never,
              options: [{ label: 'PostgreSQL' as never, description: 'Relational DB' as never }],
              multiSelect: false,
            },
          ],
        }),
      ).rejects.toThrow(/too_small/u);
    });

    it('INVALID: {chatProcessId: number} => throws parse error', async () => {
      const proxy = sessionClarifyBrokerProxy();
      proxy.setupInvalidResponse({ chatProcessId: 12345 });

      await expect(
        sessionClarifyBroker({
          sessionId: SessionIdStub(),
          guildId: GuildIdStub(),
          questId: QuestIdStub(),
          answers: [{ header: 'Database', label: 'PostgreSQL' }],
          questions: [
            {
              question: 'Which DB?' as never,
              header: 'Database' as never,
              options: [{ label: 'PostgreSQL' as never, description: 'Relational DB' as never }],
              multiSelect: false,
            },
          ],
        }),
      ).rejects.toThrow(/Expected string/u);
    });

    it('INVALID: {chatProcessId: null} => throws parse error', async () => {
      const proxy = sessionClarifyBrokerProxy();
      proxy.setupInvalidResponse({ chatProcessId: null });

      await expect(
        sessionClarifyBroker({
          sessionId: SessionIdStub(),
          guildId: GuildIdStub(),
          questId: QuestIdStub(),
          answers: [{ header: 'Database', label: 'PostgreSQL' }],
          questions: [
            {
              question: 'Which DB?' as never,
              header: 'Database' as never,
              options: [{ label: 'PostgreSQL' as never, description: 'Relational DB' as never }],
              multiSelect: false,
            },
          ],
        }),
      ).rejects.toThrow(/Expected string/u);
    });
  });

  describe('error handling', () => {
    it('ERROR: {network error} => throws network error', async () => {
      const proxy = sessionClarifyBrokerProxy();
      proxy.setupError();

      await expect(
        sessionClarifyBroker({
          sessionId: SessionIdStub(),
          guildId: GuildIdStub(),
          questId: QuestIdStub(),
          answers: [{ header: 'Database', label: 'PostgreSQL' }],
          questions: [
            {
              question: 'Which DB?' as never,
              header: 'Database' as never,
              options: [{ label: 'PostgreSQL' as never, description: 'Relational DB' as never }],
              multiSelect: false,
            },
          ],
        }),
      ).rejects.toThrow(/Failed to fetch/u);
    });
  });
});
