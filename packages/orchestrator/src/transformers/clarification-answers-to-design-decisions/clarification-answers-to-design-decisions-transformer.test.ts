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
        answers: [
          ClarificationAnswerStub({ header: 'Database Selection', labels: ['PostgreSQL'] }),
        ],
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
          ClarificationAnswerStub({ header: 'Icon Choice', labels: ['Custom freeform answer'] }),
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
          ClarificationAnswerStub({ header: 'Auth Method', labels: ['JWT'] }),
          ClarificationAnswerStub({ header: 'Storage Layer', labels: ['S3'] }),
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
        answers: [ClarificationAnswerStub({ header: 'Unrelated Header', labels: ['Something'] })],
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
        answers: [ClarificationAnswerStub({ header: 'Something', labels: ['Value'] })],
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
          ClarificationAnswerStub({ header: 'Nonexistent Topic', labels: ['Irrelevant'] }),
          ClarificationAnswerStub({ header: 'Auth Method', labels: ['JWT'] }),
          ClarificationAnswerStub({ header: 'Another Missing', labels: ['Nothing'] }),
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
        answers: [
          ClarificationAnswerStub({ header: 'database selection', labels: ['PostgreSQL'] }),
        ],
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
          ClarificationAnswerStub({ header: '  Database Selection  ', labels: ['PostgreSQL'] }),
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
        answers: [ClarificationAnswerStub({ header: 'Storage Layer', labels: ['S3'] })],
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
        answers: [
          ClarificationAnswerStub({ header: 'Database Selection', labels: ['postgresql'] }),
        ],
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
        answers: [ClarificationAnswerStub({ header: 'UI Framework (v2)', labels: ['React'] })],
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
        answers: [ClarificationAnswerStub({ header: 'Auth---Method', labels: ['JWT'] })],
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
        answers: [ClarificationAnswerStub({ header: '---Cache Strategy', labels: ['Redis'] })],
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
        answers: [ClarificationAnswerStub({ header: 'Cache Strategy!!!', labels: ['Redis'] })],
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

  describe('multi-select and typed answers', () => {
    it('VALID: {two labels and typed text} => title is the summary line, rationale lists each description then the text', () => {
      const questions = [
        ClarificationQuestionStub({
          header: 'Letters',
          options: [
            { label: 'Alpha', description: 'First letter' },
            { label: 'Beta', description: 'Second letter' },
            { label: 'Gamma', description: 'Third letter' },
          ],
        }),
      ];

      const result = clarificationAnswersToDesignDecisionsTransformer({
        answers: [
          ClarificationAnswerStub({
            header: 'Letters',
            labels: ['Alpha', 'Gamma'],
            text: 'prefer Gamma',
          }),
        ],
        questions,
      });

      expect(result).toStrictEqual([
        {
          id: 'dd-letters',
          title: 'Letters: Alpha, Gamma \u2014 prefer Gamma',
          rationale: 'First letter\nThird letter\nprefer Gamma',
          relatedNodeIds: [],
        },
      ]);
    });

    it('VALID: {typed text only, no labels} => title and rationale are the text', () => {
      const questions = [
        ClarificationQuestionStub({
          header: 'Letters',
          options: [{ label: 'Alpha', description: 'First letter' }],
        }),
      ];

      const result = clarificationAnswersToDesignDecisionsTransformer({
        answers: [
          ClarificationAnswerStub({ header: 'Letters', labels: [], text: 'my own answer' }),
        ],
        questions,
      });

      expect(result).toStrictEqual([
        {
          id: 'dd-letters',
          title: 'Letters: my own answer',
          rationale: 'my own answer',
          relatedNodeIds: [],
        },
      ]);
    });

    it('EDGE: {one label matches an option, one does not} => unmatched label is its own rationale line', () => {
      const questions = [
        ClarificationQuestionStub({
          header: 'Letters',
          options: [{ label: 'Alpha', description: 'First letter' }],
        }),
      ];

      const result = clarificationAnswersToDesignDecisionsTransformer({
        answers: [ClarificationAnswerStub({ header: 'Letters', labels: ['Alpha', 'Omega'] })],
        questions,
      });

      expect(result).toStrictEqual([
        {
          id: 'dd-letters',
          title: 'Letters: Alpha, Omega',
          rationale: 'First letter\nOmega',
          relatedNodeIds: [],
        },
      ]);
    });
  });
});
