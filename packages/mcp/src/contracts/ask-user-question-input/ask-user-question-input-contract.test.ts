import { askUserQuestionInputContract } from './ask-user-question-input-contract';
import { AskUserQuestionInputStub } from './ask-user-question-input.stub';

describe('askUserQuestionInputContract', () => {
  describe('valid inputs', () => {
    it('VALID: {single question with options} => parses successfully', () => {
      const input = AskUserQuestionInputStub();

      const result = askUserQuestionInputContract.parse(input);

      expect(result).toStrictEqual({
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
      });
    });

    it('VALID: {multiple questions} => parses all questions', () => {
      const input = AskUserQuestionInputStub({
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

      const result = askUserQuestionInputContract.parse(input);

      expect(result).toStrictEqual({
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
    });

    it('VALID: {multiSelect: true} => parses multiSelect flag', () => {
      const input = AskUserQuestionInputStub({
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

      const result = askUserQuestionInputContract.parse(input);

      expect(result).toStrictEqual({
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
    });

    it('EDGE: {empty options array} => parses question with no options', () => {
      const input = AskUserQuestionInputStub({
        questions: [
          {
            question: 'Free text question?',
            header: 'Open',
            options: [],
            multiSelect: false,
          },
        ],
      });

      const result = askUserQuestionInputContract.parse(input);

      expect(result).toStrictEqual({
        questions: [
          {
            question: 'Free text question?',
            header: 'Open',
            options: [],
            multiSelect: false,
          },
        ],
      });
    });

    it('EDGE: {empty header string} => parses with empty header', () => {
      const input = AskUserQuestionInputStub({
        questions: [
          {
            question: 'A question?',
            header: '',
            options: [{ label: 'Ok', description: '' }],
            multiSelect: false,
          },
        ],
      });

      const result = askUserQuestionInputContract.parse(input);

      expect(result).toStrictEqual({
        questions: [
          {
            question: 'A question?',
            header: '',
            options: [{ label: 'Ok', description: '' }],
            multiSelect: false,
          },
        ],
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_QUESTIONS: {empty questions array} => throws validation error', () => {
      expect(() => {
        askUserQuestionInputContract.parse({ questions: [] });
      }).toThrow(/too_small/u);
    });

    it('INVALID_QUESTION: {question: ""} => throws validation error for empty question', () => {
      expect(() => {
        askUserQuestionInputContract.parse({
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

    it('INVALID_LABEL: {label: ""} => throws validation error for empty label', () => {
      expect(() => {
        askUserQuestionInputContract.parse({
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

    it('INVALID_MULTIPLE: {missing questions} => throws validation error', () => {
      expect(() => {
        askUserQuestionInputContract.parse({});
      }).toThrow(/Required/u);
    });

    it('INVALID_MULTI_SELECT: {multiSelect: "yes"} => throws validation error for non-boolean', () => {
      expect(() => {
        askUserQuestionInputContract.parse({
          questions: [
            {
              question: 'Test?',
              header: 'Test',
              options: [],
              multiSelect: 'yes',
            },
          ],
        });
      }).toThrow(/Expected boolean/u);
    });
  });
});
