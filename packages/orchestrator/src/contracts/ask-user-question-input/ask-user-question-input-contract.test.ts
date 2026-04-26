import { askUserQuestionInputContract } from './ask-user-question-input-contract';
import { AskUserQuestionInputStub } from './ask-user-question-input.stub';

describe('askUserQuestionInputContract', () => {
  describe('valid inputs', () => {
    it('VALID: {questions: [ClarificationQuestionStub()]} => parses successfully', () => {
      const input = AskUserQuestionInputStub();

      const result = askUserQuestionInputContract.parse(input);

      expect(result.questions).toStrictEqual(input.questions);
    });

    it('VALID: {questions: []} => parses with empty questions array', () => {
      const result = askUserQuestionInputContract.parse({ questions: [] });

      expect(result.questions).toStrictEqual([]);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {missing questions field} => throws validation error', () => {
      expect(() => askUserQuestionInputContract.parse({})).toThrow(/invalid_type/u);
    });

    it('INVALID: {questions: "string"} => throws validation error', () => {
      expect(() => askUserQuestionInputContract.parse({ questions: 'not-array' })).toThrow(
        /invalid_type/u,
      );
    });
  });
});
