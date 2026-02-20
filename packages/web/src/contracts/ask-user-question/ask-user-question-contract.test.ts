import { askUserQuestionContract } from './ask-user-question-contract';
import { AskUserQuestionStub } from './ask-user-question.stub';

describe('askUserQuestionContract', () => {
  describe('valid inputs', () => {
    it('VALID: {default stub} => parses successfully', () => {
      const data = AskUserQuestionStub();

      const result = askUserQuestionContract.parse(data);

      expect(result).toStrictEqual({
        questions: [
          {
            question: 'Which option do you prefer?',
            header: 'Preference',
            options: [{ label: 'Option A', description: 'First option' }],
            multiSelect: false,
          },
        ],
      });
    });

    it('VALID: {multiSelect true, multiple options} => parses successfully', () => {
      const result = askUserQuestionContract.parse({
        questions: [
          {
            question: 'Pick colors',
            header: 'Colors',
            options: [
              { label: 'Red', description: 'Warm' },
              { label: 'Blue', description: 'Cool' },
            ],
            multiSelect: true,
          },
        ],
      });

      expect(result).toStrictEqual({
        questions: [
          {
            question: 'Pick colors',
            header: 'Colors',
            options: [
              { label: 'Red', description: 'Warm' },
              { label: 'Blue', description: 'Cool' },
            ],
            multiSelect: true,
          },
        ],
      });
    });

    it('VALID: {empty options array} => parses successfully', () => {
      const result = askUserQuestionContract.parse({
        questions: [
          {
            question: 'Anything?',
            header: 'Open',
            options: [],
            multiSelect: false,
          },
        ],
      });

      expect(result).toStrictEqual({
        questions: [
          {
            question: 'Anything?',
            header: 'Open',
            options: [],
            multiSelect: false,
          },
        ],
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_QUESTIONS: {empty questions array} => throws validation error', () => {
      expect(() => {
        askUserQuestionContract.parse({ questions: [] });
      }).toThrow(/too_small/u);
    });

    it('INVALID_QUESTION: {missing question field} => throws validation error', () => {
      expect(() => {
        askUserQuestionContract.parse({
          questions: [{ header: 'H', options: [], multiSelect: false }],
        });
      }).toThrow(/Required/u);
    });

    it('INVALID_MULTIPLE: {missing all fields} => throws validation error', () => {
      expect(() => {
        askUserQuestionContract.parse({});
      }).toThrow(/Required/u);
    });
  });
});
