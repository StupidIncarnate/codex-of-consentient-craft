import { ClarificationQuestionStub } from '../../contracts/clarification-question/clarification-question.stub';
import { clarificationAnswersToDesignDecisionsTransformer } from './clarification-answers-to-design-decisions-transformer';

describe('clarificationAnswersToDesignDecisionsTransformer', () => {
  describe('matching answers to questions', () => {
    it('VALID: {answer with matching question and option} => returns design decision with option description as rationale', () => {
      const questions = [
        ClarificationQuestionStub({
          header: 'Database Selection' as never,
          options: [
            {
              label: 'PostgreSQL' as never,
              description: 'Relational database with JSONB support' as never,
            },
            { label: 'SQLite' as never, description: 'Lightweight file-based database' as never },
          ],
        }),
      ];

      const result = clarificationAnswersToDesignDecisionsTransformer({
        answers: [{ header: 'Database Selection', label: 'PostgreSQL' }],
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
          header: 'Icon Choice' as never,
          options: [{ label: 'Skull' as never, description: 'Intimidating skull icon' as never }],
        }),
      ];

      const result = clarificationAnswersToDesignDecisionsTransformer({
        answers: [{ header: 'Icon Choice', label: 'Custom freeform answer' }],
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
          header: 'Auth Method' as never,
          options: [{ label: 'JWT' as never, description: 'Stateless token-based auth' as never }],
        }),
        ClarificationQuestionStub({
          header: 'Storage Layer' as never,
          options: [{ label: 'S3' as never, description: 'AWS object storage' as never }],
        }),
      ];

      const result = clarificationAnswersToDesignDecisionsTransformer({
        answers: [
          { header: 'Auth Method', label: 'JWT' },
          { header: 'Storage Layer', label: 'S3' },
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
          header: 'Database Selection' as never,
        }),
      ];

      const result = clarificationAnswersToDesignDecisionsTransformer({
        answers: [{ header: 'Unrelated Header', label: 'Something' }],
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
        answers: [{ header: 'Something', label: 'Value' }],
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
          header: 'Auth Method' as never,
          options: [{ label: 'JWT' as never, description: 'Token-based auth' as never }],
        }),
      ];

      const result = clarificationAnswersToDesignDecisionsTransformer({
        answers: [
          { header: 'Nonexistent Topic', label: 'Irrelevant' },
          { header: 'Auth Method', label: 'JWT' },
          { header: 'Another Missing', label: 'Nothing' },
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
          header: 'Database Selection' as never,
          options: [{ label: 'PostgreSQL' as never, description: 'Relational DB' as never }],
        }),
      ];

      const result = clarificationAnswersToDesignDecisionsTransformer({
        answers: [{ header: 'database selection', label: 'PostgreSQL' }],
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
          header: 'Database Selection' as never,
          options: [{ label: 'PostgreSQL' as never, description: 'Relational DB' as never }],
        }),
      ];

      const result = clarificationAnswersToDesignDecisionsTransformer({
        answers: [{ header: '  Database Selection  ', label: 'PostgreSQL' }],
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
          header: '  Storage Layer  ' as never,
          options: [{ label: 'S3' as never, description: 'AWS object storage' as never }],
        }),
      ];

      const result = clarificationAnswersToDesignDecisionsTransformer({
        answers: [{ header: 'Storage Layer', label: 'S3' }],
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
          header: 'Database Selection' as never,
          options: [{ label: 'PostgreSQL' as never, description: 'Relational database' as never }],
        }),
      ];

      const result = clarificationAnswersToDesignDecisionsTransformer({
        answers: [{ header: 'Database Selection', label: 'postgresql' }],
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
          header: 'UI Framework (v2)' as never,
          options: [
            { label: 'React' as never, description: 'Component-based UI library' as never },
          ],
        }),
      ];

      const result = clarificationAnswersToDesignDecisionsTransformer({
        answers: [{ header: 'UI Framework (v2)', label: 'React' }],
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
          header: 'Auth---Method' as never,
          options: [{ label: 'JWT' as never, description: 'Token auth' as never }],
        }),
      ];

      const result = clarificationAnswersToDesignDecisionsTransformer({
        answers: [{ header: 'Auth---Method', label: 'JWT' }],
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
          header: '---Cache Strategy' as never,
          options: [{ label: 'Redis' as never, description: 'In-memory cache' as never }],
        }),
      ];

      const result = clarificationAnswersToDesignDecisionsTransformer({
        answers: [{ header: '---Cache Strategy', label: 'Redis' }],
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
          header: 'Cache Strategy!!!' as never,
          options: [{ label: 'Redis' as never, description: 'In-memory cache' as never }],
        }),
      ];

      const result = clarificationAnswersToDesignDecisionsTransformer({
        answers: [{ header: 'Cache Strategy!!!', label: 'Redis' }],
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
