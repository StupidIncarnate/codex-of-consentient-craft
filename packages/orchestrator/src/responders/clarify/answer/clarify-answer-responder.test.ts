import { QuestStub } from '@dungeonmaster/shared/contracts';
import { ClarificationQuestionStub } from '../../../contracts/clarification-question/clarification-question.stub';
import { ClarifyAnswerResponder } from './clarify-answer-responder';
import { ClarifyAnswerResponderProxy } from './clarify-answer-responder.proxy';

type Quest = ReturnType<typeof QuestStub>;

describe('ClarifyAnswerResponder', () => {
  describe('persisting design decisions', () => {
    it('VALID: {answers with matching questions} => persists design decisions to quest', async () => {
      const quest = QuestStub({ designDecisions: [], status: 'explore_flows' });
      const proxy = ClarifyAnswerResponderProxy();
      proxy.setupQuestFound({ quest });

      const questions = [
        ClarificationQuestionStub({
          header: 'Database Selection' as never,
          options: [
            {
              label: 'PostgreSQL' as never,
              description: 'Relational database with JSONB support' as never,
            },
          ],
        }),
      ];

      await ClarifyAnswerResponder({
        questId: quest.id,
        answers: [{ header: 'Database Selection', label: 'PostgreSQL' }],
        questions,
      });

      const persisted = proxy.getAllPersistedContents();
      const persistedQuest = JSON.parse(String(persisted[0])) as Quest;

      expect(persistedQuest.designDecisions).toStrictEqual([
        {
          id: 'dd-database-selection',
          title: 'Database Selection: PostgreSQL',
          rationale: 'Relational database with JSONB support',
          relatedNodeIds: [],
        },
      ]);
    });

    it('VALID: {multiple answers with matching questions} => persists all design decisions to quest', async () => {
      const quest = QuestStub({ designDecisions: [], status: 'explore_flows' });
      const proxy = ClarifyAnswerResponderProxy();
      proxy.setupQuestFound({ quest });

      const questions = [
        ClarificationQuestionStub({
          header: 'Database Selection' as never,
          options: [
            {
              label: 'PostgreSQL' as never,
              description: 'Relational database with JSONB support' as never,
            },
          ],
        }),
        ClarificationQuestionStub({
          header: 'Auth Strategy' as never,
          options: [
            {
              label: 'JWT' as never,
              description: 'Stateless token-based authentication' as never,
            },
          ],
        }),
      ];

      await ClarifyAnswerResponder({
        questId: quest.id,
        answers: [
          { header: 'Database Selection', label: 'PostgreSQL' },
          { header: 'Auth Strategy', label: 'JWT' },
        ],
        questions,
      });

      const persisted = proxy.getAllPersistedContents();
      const persistedQuest = JSON.parse(String(persisted[0])) as Quest;

      expect(persistedQuest.designDecisions).toStrictEqual([
        {
          id: 'dd-database-selection',
          title: 'Database Selection: PostgreSQL',
          rationale: 'Relational database with JSONB support',
          relatedNodeIds: [],
        },
        {
          id: 'dd-auth-strategy',
          title: 'Auth Strategy: JWT',
          rationale: 'Stateless token-based authentication',
          relatedNodeIds: [],
        },
      ]);
    });

    it('VALID: {answer matches question but option label does not match} => uses answer label as rationale', async () => {
      const quest = QuestStub({ designDecisions: [], status: 'explore_flows' });
      const proxy = ClarifyAnswerResponderProxy();
      proxy.setupQuestFound({ quest });

      const questions = [
        ClarificationQuestionStub({
          header: 'Database Selection' as never,
          options: [
            {
              label: 'MySQL' as never,
              description: 'Traditional relational database' as never,
            },
          ],
        }),
      ];

      await ClarifyAnswerResponder({
        questId: quest.id,
        answers: [{ header: 'Database Selection', label: 'PostgreSQL' }],
        questions,
      });

      const persisted = proxy.getAllPersistedContents();
      const persistedQuest = JSON.parse(String(persisted[0])) as Quest;

      expect(persistedQuest.designDecisions).toStrictEqual([
        {
          id: 'dd-database-selection',
          title: 'Database Selection: PostgreSQL',
          rationale: 'PostgreSQL',
          relatedNodeIds: [],
        },
      ]);
    });

    it('EMPTY: {answers with no matching questions} => does not modify quest', async () => {
      const quest = QuestStub({ designDecisions: [], status: 'explore_flows' });
      const proxy = ClarifyAnswerResponderProxy();
      proxy.setupQuestFound({ quest });

      const questions = [
        ClarificationQuestionStub({
          header: 'Unrelated' as never,
        }),
      ];

      await ClarifyAnswerResponder({
        questId: quest.id,
        answers: [{ header: 'No Match', label: 'Value' }],
        questions,
      });

      const persisted = proxy.getAllPersistedContents();

      expect(persisted).toStrictEqual([]);
    });

    it('EMPTY: {empty answers array} => does not modify quest', async () => {
      const quest = QuestStub({ designDecisions: [], status: 'explore_flows' });
      const proxy = ClarifyAnswerResponderProxy();
      proxy.setupQuestFound({ quest });

      const questions = [
        ClarificationQuestionStub({
          header: 'Database Selection' as never,
        }),
      ];

      await ClarifyAnswerResponder({
        questId: quest.id,
        answers: [],
        questions,
      });

      const persisted = proxy.getAllPersistedContents();

      expect(persisted).toStrictEqual([]);
    });

    it('EDGE: {mixed answers where some match and some do not} => persists only matching decisions', async () => {
      const quest = QuestStub({ designDecisions: [], status: 'explore_flows' });
      const proxy = ClarifyAnswerResponderProxy();
      proxy.setupQuestFound({ quest });

      const questions = [
        ClarificationQuestionStub({
          header: 'Database Selection' as never,
          options: [
            {
              label: 'PostgreSQL' as never,
              description: 'Relational database with JSONB support' as never,
            },
          ],
        }),
      ];

      await ClarifyAnswerResponder({
        questId: quest.id,
        answers: [
          { header: 'Database Selection', label: 'PostgreSQL' },
          { header: 'Nonexistent Question', label: 'Some Value' },
        ],
        questions,
      });

      const persisted = proxy.getAllPersistedContents();
      const persistedQuest = JSON.parse(String(persisted[0])) as Quest;

      expect(persistedQuest.designDecisions).toStrictEqual([
        {
          id: 'dd-database-selection',
          title: 'Database Selection: PostgreSQL',
          rationale: 'Relational database with JSONB support',
          relatedNodeIds: [],
        },
      ]);
    });
  });
});
