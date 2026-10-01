import { AskUserQuestionStub } from '@dungeonmaster/shared/contracts/ask-user-question/ask-user-question.stub';
import { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';

import { questClarifyBroker } from './quest-clarify-broker';
import { questClarifyBrokerProxy } from './quest-clarify-broker.proxy';

describe('questClarifyBroker', () => {
  describe('successful clarification', () => {
    it('VALID: {questId, answers, questions} => returns chatProcessId', async () => {
      const proxy = questClarifyBrokerProxy();
      const chatProcessId = 'clarify-proc-1';
      proxy.setupClarify({ chatProcessId });

      const result = await questClarifyBroker({
        questId: QuestIdStub({ value: 'quest-1' }),
        answers: [{ header: 'Database', labels: ['PostgreSQL'] }],
        questions: AskUserQuestionStub({
          questions: [
            {
              question: 'Which DB?',
              header: 'Database',
              options: [{ label: 'PostgreSQL', description: 'Relational DB' }],
              multiSelect: false,
            },
          ],
        }).questions,
      });

      expect(result).toStrictEqual({ chatProcessId: 'clarify-proc-1' });
    });

    it('VALID: {labels Alpha+Gamma, text, no images} => POST body carries labels and text exactly and omits images', async () => {
      const proxy = questClarifyBrokerProxy();
      proxy.setupClarify({ chatProcessId: 'clarify-proc-2' });
      const { questions } = AskUserQuestionStub({
        questions: [
          {
            question: 'Which letters?',
            header: 'Letters',
            options: [
              { label: 'Alpha', description: 'First' },
              { label: 'Gamma', description: 'Third' },
            ],
            multiSelect: true,
          },
        ],
      });

      await questClarifyBroker({
        questId: QuestIdStub({ value: 'quest-1' }),
        answers: [{ header: 'Letters', labels: ['Alpha', 'Gamma'], text: 'prefer Gamma' }],
        questions,
      });

      await expect(proxy.getRequestBodies()).resolves.toStrictEqual([
        {
          answers: [{ header: 'Letters', labels: ['Alpha', 'Gamma'], text: 'prefer Gamma' }],
          questions,
        },
      ]);
    });
  });

  describe('response parsing', () => {
    it('INVALID: {chatProcessId: empty string} => throws parse error', async () => {
      const proxy = questClarifyBrokerProxy();
      proxy.setupInvalidResponse({ chatProcessId: '' });

      await expect(
        questClarifyBroker({
          questId: QuestIdStub({ value: 'quest-1' }),
          answers: [{ header: 'Database', labels: ['PostgreSQL'] }],
          questions: AskUserQuestionStub({
            questions: [
              {
                question: 'Which DB?',
                header: 'Database',
                options: [{ label: 'PostgreSQL', description: 'Relational DB' }],
                multiSelect: false,
              },
            ],
          }).questions,
        }),
      ).rejects.toThrow(/too_small/u);
    });

    it('INVALID: {chatProcessId: number} => throws parse error', async () => {
      const proxy = questClarifyBrokerProxy();
      proxy.setupInvalidResponse({ chatProcessId: 12345 });

      await expect(
        questClarifyBroker({
          questId: QuestIdStub({ value: 'quest-1' }),
          answers: [{ header: 'Database', labels: ['PostgreSQL'] }],
          questions: AskUserQuestionStub({
            questions: [
              {
                question: 'Which DB?',
                header: 'Database',
                options: [{ label: 'PostgreSQL', description: 'Relational DB' }],
                multiSelect: false,
              },
            ],
          }).questions,
        }),
      ).rejects.toThrow(/expected string/u);
    });
  });

  describe('error handling', () => {
    it('ERROR: {network error} => rejects naming the request', async () => {
      const proxy = questClarifyBrokerProxy();
      proxy.setupError();

      await expect(
        questClarifyBroker({
          questId: QuestIdStub({ value: 'quest-1' }),
          answers: [{ header: 'Database', labels: ['PostgreSQL'] }],
          questions: AskUserQuestionStub({
            questions: [
              {
                question: 'Which DB?',
                header: 'Database',
                options: [{ label: 'PostgreSQL', description: 'Relational DB' }],
                multiSelect: false,
              },
            ],
          }).questions,
        }),
      ).rejects.toThrow(/^POST \/api\/quests\/quest-1\/clarify failed: Failed to fetch$/u);
    });

    it('ERROR: {400 with error body} => rejects with exactly the server error text', async () => {
      const proxy = questClarifyBrokerProxy();
      proxy.setupRefused({ status: 400, error: 'x' });

      await expect(
        questClarifyBroker({
          questId: QuestIdStub({ value: 'quest-1' }),
          answers: [{ header: 'Database', labels: ['PostgreSQL'] }],
          questions: AskUserQuestionStub({
            questions: [
              {
                question: 'Which DB?',
                header: 'Database',
                options: [{ label: 'PostgreSQL', description: 'Relational DB' }],
                multiSelect: false,
              },
            ],
          }).questions,
        }),
      ).rejects.toThrow(/^x$/u);
    });

    it('ERROR: {500 with no error body} => rejects with the generic status message', async () => {
      const proxy = questClarifyBrokerProxy();
      proxy.setupRefusedNoBody({ status: 500 });

      await expect(
        questClarifyBroker({
          questId: QuestIdStub({ value: 'quest-1' }),
          answers: [{ header: 'Database', labels: ['PostgreSQL'] }],
          questions: AskUserQuestionStub({
            questions: [
              {
                question: 'Which DB?',
                header: 'Database',
                options: [{ label: 'PostgreSQL', description: 'Relational DB' }],
                multiSelect: false,
              },
            ],
          }).questions,
        }),
      ).rejects.toThrow(/^POST \/api\/quests\/quest-1\/clarify failed with status 500$/u);
    });

    it('ERROR: {502 with a non-JSON body} => rejects with the generic status message', async () => {
      const proxy = questClarifyBrokerProxy();
      proxy.setupRefusedRawBody({ status: 502, bodyText: '<html>Bad Gateway</html>' });

      await expect(
        questClarifyBroker({
          questId: QuestIdStub({ value: 'quest-1' }),
          answers: [{ header: 'Database', labels: ['PostgreSQL'] }],
          questions: AskUserQuestionStub({
            questions: [
              {
                question: 'Which DB?',
                header: 'Database',
                options: [{ label: 'PostgreSQL', description: 'Relational DB' }],
                multiSelect: false,
              },
            ],
          }).questions,
        }),
      ).rejects.toThrow(/^POST \/api\/quests\/quest-1\/clarify failed with status 502$/u);
    });
  });
});
