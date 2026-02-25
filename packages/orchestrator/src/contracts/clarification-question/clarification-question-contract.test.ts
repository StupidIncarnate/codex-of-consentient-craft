import { clarificationQuestionContract } from './clarification-question-contract';
import { ClarificationQuestionStub } from './clarification-question.stub';

describe('clarificationQuestionContract', () => {
  describe('valid questions', () => {
    it('VALID: {question, header, options, multiSelect} => parses successfully', () => {
      const question = ClarificationQuestionStub();

      const result = clarificationQuestionContract.parse(question);

      expect(result).toStrictEqual({
        question: 'Which approach do you prefer?',
        header: 'Architecture Choice',
        options: [
          { label: 'Option A', description: 'Use REST endpoints' },
          { label: 'Option B', description: 'Use GraphQL' },
        ],
        multiSelect: false,
      });
    });

    it('VALID: {multiSelect: true} => parses with multi-select enabled', () => {
      const question = ClarificationQuestionStub({ multiSelect: true });

      const result = clarificationQuestionContract.parse(question);

      expect(result.multiSelect).toBe(true);
    });

    it('VALID: {empty options array} => parses successfully', () => {
      const question = ClarificationQuestionStub({ options: [] });

      const result = clarificationQuestionContract.parse(question);

      expect(result.options).toStrictEqual([]);
    });
  });

  describe('invalid questions', () => {
    it('INVALID_QUESTION: {question: ""} => throws validation error', () => {
      expect(() =>
        clarificationQuestionContract.parse({
          question: '',
          header: 'Header',
          options: [],
          multiSelect: false,
        }),
      ).toThrow(/too_small/u);
    });

    it('INVALID_LABEL: {option with label: ""} => throws validation error', () => {
      expect(() =>
        clarificationQuestionContract.parse({
          question: 'Valid question',
          header: 'Header',
          options: [{ label: '', description: 'Valid' }],
          multiSelect: false,
        }),
      ).toThrow(/too_small/u);
    });

    it('INVALID_MISSING_FIELDS: {missing question field} => throws validation error', () => {
      expect(() =>
        clarificationQuestionContract.parse({
          header: 'H',
          options: [],
          multiSelect: false,
        }),
      ).toThrow(/invalid_type/u);
    });

    it('INVALID_TYPE: {multiSelect as string} => throws validation error', () => {
      expect(() =>
        clarificationQuestionContract.parse({
          question: 'Q',
          header: 'H',
          options: [],
          multiSelect: 'yes',
        }),
      ).toThrow(/invalid_type/u);
    });
  });
});
