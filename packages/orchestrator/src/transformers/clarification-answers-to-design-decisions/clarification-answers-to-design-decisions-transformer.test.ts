import { ClarificationAnswerStub } from '../../contracts/clarification-answer/clarification-answer.stub';
import { ClarificationQuestionStub } from '../../contracts/clarification-question/clarification-question.stub';
import { clarificationAnswersToDesignDecisionsTransformer } from './clarification-answers-to-design-decisions-transformer';

describe('clarificationAnswersToDesignDecisionsTransformer', () => {
  describe('matching answers to questions', () => {
    it('VALID: {answer with matching question and option} => returns design decision with option description as rationale', () => {
      const questions = [
        ClarificationQuestionStub({
          header: 'Database Selection',
          options: [
            {
              label: 'PostgreSQL',
              description: 'Relational database with JSONB support',
            },
            { label: 'SQLite', description: 'Lightweight file-based database' },
          ],
        }),
      ];

      const result = clarificationAnswersToDesignDecisionsTransformer({
        answers: [ClarificationAnswerStub({ header: 'Database Selection', label: 'PostgreSQL' })],
        questions,
      });

      expect(result).toStrictEqual([
        {
          id: 'dd-database-selection',
          title: 'Database Selection: PostgreSQL',
          rationale: 'Relational database with JSONB support',
          relatedNodeIds: [],
        },
      ]);
    });

    it('VALID: {answer with matching question but no matching option} => returns design decision with label as rationale', () => {
      const questions = [
        ClarificationQuestionStub({
          header: 'Icon Choice',
          options: [{ label: 'Skull', description: 'Intimidating skull icon' }],
        }),
      ];

      const result = clarificationAnswersToDesignDecisionsTransformer({
        answers: [
          ClarificationAnswerStub({ header: 'Icon Choice', label: 'Custom freeform answer' }),
        ],
        questions,
      });

      expect(result).toStrictEqual([
        {
          id: 'dd-icon-choice',
          title: 'Icon Choice: Custom freeform answer',
          rationale: 'Custom freeform answer',
          relatedNodeIds: [],
        },
      ]);
    });

    it('VALID: {multiple answers with matching questions} => returns multiple design decisions', () => {
      const questions = [
        ClarificationQuestionStub({
          header: 'Auth Method',
          options: [{ label: 'JWT', description: 'Stateless token-based auth' }],
        }),
        ClarificationQuestionStub({
          header: 'Storage Layer',
          options: [{ label: 'S3', description: 'AWS object storage' }],
        }),
      ];

      const result = clarificationAnswersToDesignDecisionsTransformer({
        answers: [
          ClarificationAnswerStub({ header: 'Auth Method', label: 'JWT' }),
          ClarificationAnswerStub({ header: 'Storage Layer', label: 'S3' }),
        ],
        questions,
      });

      expect(result).toStrictEqual([
        {
          id: 'dd-auth-method',
          title: 'Auth Method: JWT',
          rationale: 'Stateless token-based auth',
          relatedNodeIds: [],
        },
        {
          id: 'dd-storage-layer',
          title: 'Storage Layer: S3',
          rationale: 'AWS object storage',
          relatedNodeIds: [],
        },
      ]);
    });
  });

  describe('skipping unmatched answers', () => {
    it('EMPTY: {answer with no matching question} => returns empty array', () => {
      const questions = [
        ClarificationQuestionStub({
          header: 'Database Selection',
        }),
      ];

      const result = clarificationAnswersToDesignDecisionsTransformer({
        answers: [ClarificationAnswerStub({ header: 'Unrelated Header', label: 'Something' })],
        questions,
      });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {empty answers array} => returns empty array', () => {
      const result = clarificationAnswersToDesignDecisionsTransformer({
        answers: [],
        questions: [ClarificationQuestionStub()],
      });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {empty questions array} => returns empty array', () => {
      const result = clarificationAnswersToDesignDecisionsTransformer({
        answers: [ClarificationAnswerStub({ header: 'Something', label: 'Value' })],
        questions: [],
      });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {both answers and questions are empty arrays} => returns empty array', () => {
      const result = clarificationAnswersToDesignDecisionsTransformer({
        answers: [],
        questions: [],
      });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {mix of matching and non-matching answers} => returns only matched design decisions', () => {
      const questions = [
        ClarificationQuestionStub({
          header: 'Auth Method',
          options: [{ label: 'JWT', description: 'Token-based auth' }],
        }),
      ];

      const result = clarificationAnswersToDesignDecisionsTransformer({
        answers: [
          ClarificationAnswerStub({ header: 'Nonexistent Topic', label: 'Irrelevant' }),
          ClarificationAnswerStub({ header: 'Auth Method', label: 'JWT' }),
          ClarificationAnswerStub({ header: 'Another Missing', label: 'Nothing' }),
        ],
        questions,
      });

      expect(result).toStrictEqual([
        {
          id: 'dd-auth-method',
          title: 'Auth Method: JWT',
          rationale: 'Token-based auth',
          relatedNodeIds: [],
        },
      ]);
    });
  });

  describe('header matching', () => {
    it('EDGE: {answer header with different casing} => matches case-insensitively', () => {
      const questions = [
        ClarificationQuestionStub({
          header: 'Database Selection',
          options: [{ label: 'PostgreSQL', description: 'Relational DB' }],
        }),
      ];

      const result = clarificationAnswersToDesignDecisionsTransformer({
        answers: [ClarificationAnswerStub({ header: 'database selection', label: 'PostgreSQL' })],
        questions,
      });

      expect(result).toStrictEqual([
        {
          id: 'dd-database-selection',
          title: 'database selection: PostgreSQL',
          rationale: 'Relational DB',
          relatedNodeIds: [],
        },
      ]);
    });

    it('EDGE: {answer header with extra whitespace} => trims and matches', () => {
      const questions = [
        ClarificationQuestionStub({
          header: 'Database Selection',
          options: [{ label: 'PostgreSQL', description: 'Relational DB' }],
        }),
      ];

      const result = clarificationAnswersToDesignDecisionsTransformer({
        answers: [
          ClarificationAnswerStub({ header: '  Database Selection  ', label: 'PostgreSQL' }),
        ],
        questions,
      });

      expect(result).toStrictEqual([
        {
          id: 'dd-database-selection',
          title: '  Database Selection  : PostgreSQL',
          rationale: 'Relational DB',
          relatedNodeIds: [],
        },
      ]);
    });

    it('EDGE: {question header with extra whitespace} => trims and matches', () => {
      const questions = [
        ClarificationQuestionStub({
          header: '  Storage Layer  ',
          options: [{ label: 'S3', description: 'AWS object storage' }],
        }),
      ];

      const result = clarificationAnswersToDesignDecisionsTransformer({
        answers: [ClarificationAnswerStub({ header: 'Storage Layer', label: 'S3' })],
        questions,
      });

      expect(result).toStrictEqual([
        {
          id: 'dd-storage-layer',
          title: 'Storage Layer: S3',
          rationale: 'AWS object storage',
          relatedNodeIds: [],
        },
      ]);
    });
  });

  describe('option label matching', () => {
    it('EDGE: {answer label differs in case from option label} => falls back to label as rationale', () => {
      const questions = [
        ClarificationQuestionStub({
          header: 'Database Selection',
          options: [{ label: 'PostgreSQL', description: 'Relational database' }],
        }),
      ];

      const result = clarificationAnswersToDesignDecisionsTransformer({
        answers: [ClarificationAnswerStub({ header: 'Database Selection', label: 'postgresql' })],
        questions,
      });

      expect(result).toStrictEqual([
        {
          id: 'dd-database-selection',
          title: 'Database Selection: postgresql',
          rationale: 'postgresql',
          relatedNodeIds: [],
        },
      ]);
    });
  });

  describe('ID generation', () => {
    it('EDGE: {header with special characters} => generates valid kebab-case ID', () => {
      const questions = [
        ClarificationQuestionStub({
          header: 'UI Framework (v2)',
          options: [{ label: 'React', description: 'Component-based UI library' }],
        }),
      ];

      const result = clarificationAnswersToDesignDecisionsTransformer({
        answers: [ClarificationAnswerStub({ header: 'UI Framework (v2)', label: 'React' })],
        questions,
      });

      expect(result).toStrictEqual([
        {
          id: 'dd-ui-framework-v2',
          title: 'UI Framework (v2): React',
          rationale: 'Component-based UI library',
          relatedNodeIds: [],
        },
      ]);
    });

    it('EDGE: {header with consecutive special characters} => collapses to single hyphen', () => {
      const questions = [
        ClarificationQuestionStub({
          header: 'Auth---Method',
          options: [{ label: 'JWT', description: 'Token auth' }],
        }),
      ];

      const result = clarificationAnswersToDesignDecisionsTransformer({
        answers: [ClarificationAnswerStub({ header: 'Auth---Method', label: 'JWT' })],
        questions,
      });

      expect(result).toStrictEqual([
        {
          id: 'dd-auth-method',
          title: 'Auth---Method: JWT',
          rationale: 'Token auth',
          relatedNodeIds: [],
        },
      ]);
    });

    it('EDGE: {header with leading special characters} => strips leading hyphen from ID', () => {
      const questions = [
        ClarificationQuestionStub({
          header: '---Cache Strategy',
          options: [{ label: 'Redis', description: 'In-memory cache' }],
        }),
      ];

      const result = clarificationAnswersToDesignDecisionsTransformer({
        answers: [ClarificationAnswerStub({ header: '---Cache Strategy', label: 'Redis' })],
        questions,
      });

      expect(result).toStrictEqual([
        {
          id: 'dd-cache-strategy',
          title: '---Cache Strategy: Redis',
          rationale: 'In-memory cache',
          relatedNodeIds: [],
        },
      ]);
    });

    it('EDGE: {header with trailing special characters} => strips trailing hyphen from ID', () => {
      const questions = [
        ClarificationQuestionStub({
          header: 'Cache Strategy!!!',
          options: [{ label: 'Redis', description: 'In-memory cache' }],
        }),
      ];

      const result = clarificationAnswersToDesignDecisionsTransformer({
        answers: [ClarificationAnswerStub({ header: 'Cache Strategy!!!', label: 'Redis' })],
        questions,
      });

      expect(result).toStrictEqual([
        {
          id: 'dd-cache-strategy',
          title: 'Cache Strategy!!!: Redis',
          rationale: 'In-memory cache',
          relatedNodeIds: [],
        },
      ]);
    });
  });
});
