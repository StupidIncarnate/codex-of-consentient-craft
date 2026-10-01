import { ClarificationAnswerStub } from '../../../contracts/clarification-answer/clarification-answer.stub';
import { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';
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
          header: 'Database Selection',
          options: [
            {
              label: 'PostgreSQL',
              description: 'Relational database with JSONB support',
            },
          ],
        }),
      ];

      await ClarifyAnswerResponder({
        questId: quest.id,
        answers: [
          ClarificationAnswerStub({ header: 'Database Selection', labels: ['PostgreSQL'] }),
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

    it('VALID: {multiple answers with matching questions} => persists all design decisions to quest', async () => {
      const quest = QuestStub({ designDecisions: [], status: 'explore_flows' });
      const proxy = ClarifyAnswerResponderProxy();
      proxy.setupQuestFound({ quest });

      const questions = [
        ClarificationQuestionStub({
          header: 'Database Selection',
          options: [
            {
              label: 'PostgreSQL',
              description: 'Relational database with JSONB support',
            },
          ],
        }),
        ClarificationQuestionStub({
          header: 'Auth Strategy',
          options: [
            {
              label: 'JWT',
              description: 'Stateless token-based authentication',
            },
          ],
        }),
      ];

      await ClarifyAnswerResponder({
        questId: quest.id,
        answers: [
          ClarificationAnswerStub({ header: 'Database Selection', labels: ['PostgreSQL'] }),
          ClarificationAnswerStub({ header: 'Auth Strategy', labels: ['JWT'] }),
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
          header: 'Database Selection',
          options: [
            {
              label: 'MySQL',
              description: 'Traditional relational database',
            },
          ],
        }),
      ];

      await ClarifyAnswerResponder({
        questId: quest.id,
        answers: [
          ClarificationAnswerStub({ header: 'Database Selection', labels: ['PostgreSQL'] }),
        ],
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

    it('VALID: {two labels and typed text} => persists the summary title and one rationale line per pick', async () => {
      const quest = QuestStub({ designDecisions: [], status: 'explore_flows' });
      const proxy = ClarifyAnswerResponderProxy();
      proxy.setupQuestFound({ quest });

      const questions = [
        ClarificationQuestionStub({
          header: 'Letters',
          options: [
            { label: 'Alpha', description: 'First letter' },
            { label: 'Gamma', description: 'Third letter' },
          ],
        }),
      ];

      await ClarifyAnswerResponder({
        questId: quest.id,
        answers: [
          ClarificationAnswerStub({
            header: 'Letters',
            labels: ['Alpha', 'Gamma'],
            text: 'prefer Gamma',
          }),
        ],
        questions,
      });

      const persisted = proxy.getAllPersistedContents();
      const persistedQuest = JSON.parse(String(persisted[0])) as Quest;

      expect(persistedQuest.designDecisions).toStrictEqual([
        {
          id: 'dd-letters',
          title: 'Letters: Alpha, Gamma \u2014 prefer Gamma',
          rationale: 'First letter\nThird letter\nprefer Gamma',
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
          header: 'Unrelated',
        }),
      ];

      await ClarifyAnswerResponder({
        questId: quest.id,
        answers: [ClarificationAnswerStub({ header: 'No Match', labels: ['Value'] })],
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
          header: 'Database Selection',
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
          header: 'Database Selection',
          options: [
            {
              label: 'PostgreSQL',
              description: 'Relational database with JSONB support',
            },
          ],
        }),
      ];

      await ClarifyAnswerResponder({
        questId: quest.id,
        answers: [
          ClarificationAnswerStub({ header: 'Database Selection', labels: ['PostgreSQL'] }),
          ClarificationAnswerStub({ header: 'Nonexistent Question', labels: ['Some Value'] }),
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
