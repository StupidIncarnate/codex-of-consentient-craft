import { questClarificationContract } from './quest-clarification-contract';
import { QuestClarificationStub } from './quest-clarification.stub';

describe('questClarificationContract', () => {
  describe('valid clarifications', () => {
    it('VALID: {default stub} => parses successfully', () => {
      const clarification = QuestClarificationStub();

      const result = questClarificationContract.parse(clarification);

      expect(result).toStrictEqual({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        questions: [
          {
            question: 'Which approach do you prefer?',
            header: 'Design Choice',
            options: [
              { label: 'Option A', description: 'First approach' },
              { label: 'Option B', description: 'Second approach' },
            ],
            multiSelect: false,
          },
        ],
        answer: 'Option A',
        timestamp: '2024-01-15T10:00:00.000Z',
      });
    });

    it('VALID: {multiple questions} => parses all questions', () => {
      const clarification = QuestClarificationStub({
        questions: [
          {
            question: 'First question?',
            header: 'Header 1',
            options: [{ label: 'Yes', description: 'Confirm' }],
            multiSelect: false,
          },
          {
            question: 'Second question?',
            header: 'Header 2',
            options: [
              { label: 'A', description: 'Alpha' },
              { label: 'B', description: 'Beta' },
            ],
            multiSelect: true,
          },
        ],
      });

      const result = questClarificationContract.parse(clarification);

      expect(result).toStrictEqual({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        questions: [
          {
            question: 'First question?',
            header: 'Header 1',
            options: [{ label: 'Yes', description: 'Confirm' }],
            multiSelect: false,
          },
          {
            question: 'Second question?',
            header: 'Header 2',
            options: [
              { label: 'A', description: 'Alpha' },
              { label: 'B', description: 'Beta' },
            ],
            multiSelect: true,
          },
        ],
        answer: 'Option A',
        timestamp: '2024-01-15T10:00:00.000Z',
      });
    });

    it('VALID: {multiSelect: true} => parses multiSelect flag', () => {
      const clarification = QuestClarificationStub({
        questions: [
          {
            question: 'Select all that apply',
            header: 'Multi',
            options: [
              { label: 'X', description: 'Option X' },
              { label: 'Y', description: 'Option Y' },
            ],
            multiSelect: true,
          },
        ],
      });

      const result = questClarificationContract.parse(clarification);

      expect(result.questions).toStrictEqual([
        {
          question: 'Select all that apply',
          header: 'Multi',
          options: [
            { label: 'X', description: 'Option X' },
            { label: 'Y', description: 'Option Y' },
          ],
          multiSelect: true,
        },
      ]);
    });

    it('VALID: {custom answer} => parses with override', () => {
      const clarification = QuestClarificationStub({
        answer: 'Option B - second approach',
      });

      const result = questClarificationContract.parse(clarification);

      expect(result.answer).toBe('Option B - second approach');
    });

    it('EDGE: {empty options array} => parses question with no options', () => {
      const clarification = QuestClarificationStub({
        questions: [
          {
            question: 'Free text question?',
            header: 'Open',
            options: [],
            multiSelect: false,
          },
        ],
      });

      const result = questClarificationContract.parse(clarification);

      expect(result.questions).toStrictEqual([
        {
          question: 'Free text question?',
          header: 'Open',
          options: [],
          multiSelect: false,
        },
      ]);
    });

    it('EDGE: {empty header and description} => parses with empty strings', () => {
      const clarification = QuestClarificationStub({
        questions: [
          {
            question: 'A question?',
            header: '',
            options: [{ label: 'Ok', description: '' }],
            multiSelect: false,
          },
        ],
      });

      const result = questClarificationContract.parse(clarification);

      expect(result.questions).toStrictEqual([
        {
          question: 'A question?',
          header: '',
          options: [{ label: 'Ok', description: '' }],
          multiSelect: false,
        },
      ]);
    });
  });

  describe('invalid clarifications', () => {
    it('INVALID_MULTIPLE: {missing required fields} => throws validation error', () => {
      expect(() => {
        questClarificationContract.parse({});
      }).toThrow(/Required/u);
    });

    it('INVALID_ID: {id: "not-a-uuid"} => throws validation error', () => {
      expect(() => {
        questClarificationContract.parse({
          ...QuestClarificationStub(),
          id: 'not-a-uuid',
        });
      }).toThrow(/Invalid uuid/u);
    });

    it('INVALID_QUESTIONS: {questions: []} => throws validation error for empty array', () => {
      expect(() => {
        questClarificationContract.parse({
          ...QuestClarificationStub(),
          questions: [],
        });
      }).toThrow(/too_small/u);
    });

    it('INVALID_QUESTION: {question: ""} => throws validation error for empty question text', () => {
      expect(() => {
        questClarificationContract.parse({
          ...QuestClarificationStub(),
          questions: [
            {
              question: '',
              header: 'Test',
              options: [],
              multiSelect: false,
            },
          ],
        });
      }).toThrow(/too_small/u);
    });

    it('INVALID_TIMESTAMP: {timestamp: "not-a-timestamp"} => throws validation error', () => {
      expect(() => {
        questClarificationContract.parse({
          ...QuestClarificationStub(),
          timestamp: 'not-a-timestamp',
        });
      }).toThrow(/Invalid datetime/u);
    });

    it('INVALID_LABEL: {label: ""} => throws validation error for empty label', () => {
      expect(() => {
        questClarificationContract.parse({
          ...QuestClarificationStub(),
          questions: [
            {
              question: 'Test?',
              header: 'Test',
              options: [{ label: '', description: 'desc' }],
              multiSelect: false,
            },
          ],
        });
      }).toThrow(/too_small/u);
    });
  });
});
