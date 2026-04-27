import { ProcessIdStub, QuestIdStub } from '@dungeonmaster/shared/contracts';

import { questClarifyBroker } from './quest-clarify-broker';
import { questClarifyBrokerProxy } from './quest-clarify-broker.proxy';

describe('questClarifyBroker', () => {
  describe('successful clarification', () => {
    it('VALID: {questId, answers, questions} => returns chatProcessId', async () => {
      const proxy = questClarifyBrokerProxy();
      const chatProcessId = ProcessIdStub({ value: 'clarify-proc-1' });
      proxy.setupClarify({ chatProcessId });

      const result = await questClarifyBroker({
        questId: QuestIdStub({ value: 'quest-1' }),
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

      expect(result).toStrictEqual({ chatProcessId: 'clarify-proc-1' });
    });
  });

  describe('response parsing', () => {
    it('INVALID: {chatProcessId: empty string} => throws parse error', async () => {
      const proxy = questClarifyBrokerProxy();
      proxy.setupInvalidResponse({ chatProcessId: '' });

      await expect(
        questClarifyBroker({
          questId: QuestIdStub({ value: 'quest-1' }),
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
      const proxy = questClarifyBrokerProxy();
      proxy.setupInvalidResponse({ chatProcessId: 12345 });

      await expect(
        questClarifyBroker({
          questId: QuestIdStub({ value: 'quest-1' }),
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
      const proxy = questClarifyBrokerProxy();
      proxy.setupError();

      await expect(
        questClarifyBroker({
          questId: QuestIdStub({ value: 'quest-1' }),
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
      ).rejects.toThrow(/fetch/iu);
    });
  });
});
