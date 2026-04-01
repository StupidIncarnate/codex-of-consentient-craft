import {
  GuildIdStub,
  ProcessIdStub,
  QuestIdStub,
  SessionIdStub,
} from '@dungeonmaster/shared/contracts';
import { orchestratorClarifyAdapter } from './orchestrator-clarify-adapter';
import { orchestratorClarifyAdapterProxy } from './orchestrator-clarify-adapter.proxy';

describe('orchestratorClarifyAdapter', () => {
  describe('successful clarify', () => {
    it('VALID: {guildId, sessionId, questId, answers, questions} => returns chatProcessId', async () => {
      const proxy = orchestratorClarifyAdapterProxy();
      const chatProcessId = ProcessIdStub({ value: 'clarify-process-123' });
      proxy.returns({ chatProcessId });

      const result = await orchestratorClarifyAdapter({
        guildId: GuildIdStub(),
        sessionId: SessionIdStub(),
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

      expect(result).toStrictEqual({ chatProcessId: 'clarify-process-123' });
    });
  });

  describe('error handling', () => {
    it('ERROR: {orchestrator throws} => propagates error', async () => {
      const proxy = orchestratorClarifyAdapterProxy();
      proxy.throws({ error: new Error('Orchestrator unavailable') });

      await expect(
        orchestratorClarifyAdapter({
          guildId: GuildIdStub(),
          sessionId: SessionIdStub(),
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
      ).rejects.toThrow(/Orchestrator unavailable/u);
    });
  });
});
