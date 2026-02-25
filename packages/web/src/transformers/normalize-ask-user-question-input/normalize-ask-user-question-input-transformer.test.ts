import { AskUserQuestionStub } from '../../contracts/ask-user-question/ask-user-question.stub';
import { normalizeAskUserQuestionInputTransformer } from './normalize-ask-user-question-input-transformer';

const createStringQuestionsInput = () => {
  const stubData = AskUserQuestionStub();

  return { questions: JSON.stringify(stubData.questions) };
};

describe('normalizeAskUserQuestionInputTransformer', () => {
  describe('non-AskUserQuestion tools', () => {
    it('VALID: {name is not AskUserQuestion} => returns input unchanged', () => {
      const stubData = AskUserQuestionStub();

      const result = normalizeAskUserQuestionInputTransformer({
        name: 'read_file',
        input: stubData,
      });

      expect(result).toStrictEqual(stubData);
    });

    it('EDGE: {name is not AskUserQuestion, input is null} => returns empty object', () => {
      const result = normalizeAskUserQuestionInputTransformer({ name: 'read_file', input: null });

      expect(result).toStrictEqual({});
    });

    it('EDGE: {name is not AskUserQuestion, input is undefined} => returns empty object', () => {
      const result = normalizeAskUserQuestionInputTransformer({
        name: 'read_file',
        input: undefined,
      });

      expect(result).toStrictEqual({});
    });
  });

  describe('AskUserQuestion with array questions', () => {
    it('VALID: {questions is already an array} => returns input unchanged', () => {
      const stubData = AskUserQuestionStub();

      const result = normalizeAskUserQuestionInputTransformer({
        name: 'mcp__dungeonmaster__ask-user-question',
        input: stubData,
      });

      expect(result).toStrictEqual(stubData);
    });
  });

  describe('AskUserQuestion with string questions', () => {
    it('VALID: {questions is a JSON-encoded array string} => returns input with parsed questions array', () => {
      const stubData = AskUserQuestionStub();
      const stringInput = createStringQuestionsInput();

      const result = normalizeAskUserQuestionInputTransformer({
        name: 'mcp__dungeonmaster__ask-user-question',
        input: stringInput,
      });

      expect(result).toStrictEqual(stubData);
    });

    it('INVALID: {questions is a non-JSON string} => returns input unchanged', () => {
      const result = normalizeAskUserQuestionInputTransformer({
        name: 'mcp__dungeonmaster__ask-user-question',
        input: { questions: 'not valid json' },
      });

      expect(result).toStrictEqual({ questions: 'not valid json' });
    });

    it('INVALID: {questions string parses to non-array} => returns input unchanged', () => {
      const nonArrayJson = JSON.stringify({ not: 'an array' });

      const result = normalizeAskUserQuestionInputTransformer({
        name: 'mcp__dungeonmaster__ask-user-question',
        input: { questions: nonArrayJson },
      });

      expect(result).toStrictEqual({ questions: nonArrayJson });
    });
  });

  describe('AskUserQuestion with missing input', () => {
    it('EDGE: {input is null} => returns empty object', () => {
      const result = normalizeAskUserQuestionInputTransformer({
        name: 'mcp__dungeonmaster__ask-user-question',
        input: null,
      });

      expect(result).toStrictEqual({});
    });

    it('EDGE: {input has no questions field} => returns input unchanged', () => {
      const result = normalizeAskUserQuestionInputTransformer({
        name: 'mcp__dungeonmaster__ask-user-question',
        input: { other: 'field' },
      });

      expect(result).toStrictEqual({ other: 'field' });
    });

    it('EDGE: {input is undefined} => returns empty object', () => {
      const result = normalizeAskUserQuestionInputTransformer({
        name: 'mcp__dungeonmaster__ask-user-question',
        input: undefined,
      });

      expect(result).toStrictEqual({});
    });

    it('EDGE: {input is a non-object primitive} => returns input unchanged', () => {
      const result = normalizeAskUserQuestionInputTransformer({
        name: 'mcp__dungeonmaster__ask-user-question',
        input: 'some string',
      });

      expect(result).toBe('some string');
    });
  });
});
