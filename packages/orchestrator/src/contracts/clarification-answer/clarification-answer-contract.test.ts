import { clarificationAnswerContract } from './clarification-answer-contract';
import { ClarificationAnswerStub } from './clarification-answer.stub';

describe('clarificationAnswerContract', () => {
  describe('valid answers', () => {
    it('VALID: {header, labels} => parses both fields', () => {
      const answer = ClarificationAnswerStub({
        header: 'Database',
        labels: ['PostgreSQL'] as never,
      });

      const result = clarificationAnswerContract.parse(answer);

      expect(result).toStrictEqual({ header: 'Database', labels: ['PostgreSQL'] });
    });

    it('VALID: {default stub} => parses the stub values', () => {
      const result = clarificationAnswerContract.parse(ClarificationAnswerStub());

      expect(result).toStrictEqual({ header: 'Architecture Choice', labels: ['Option A'] });
    });

    it('VALID: {labels: [Alpha, Gamma], text} => keeps every label in order with the text', () => {
      const result = clarificationAnswerContract.parse({
        header: 'Letters',
        labels: ['Alpha', 'Gamma'],
        text: 'prefer Gamma',
      });

      expect(result).toStrictEqual({
        header: 'Letters',
        labels: ['Alpha', 'Gamma'],
        text: 'prefer Gamma',
      });
    });

    it('VALID: {labels: [], text} => parses a typed-only answer', () => {
      const result = clarificationAnswerContract.parse({
        header: 'Letters',
        labels: [],
        text: 'my own answer',
      });

      expect(result).toStrictEqual({ header: 'Letters', labels: [], text: 'my own answer' });
    });

    it('EDGE: {text: "  prefer Gamma  "} => parses the text trimmed', () => {
      const result = clarificationAnswerContract.parse({
        header: 'Letters',
        labels: ['Alpha'],
        text: '  prefer Gamma  ',
      });

      expect(result).toStrictEqual({ header: 'Letters', labels: ['Alpha'], text: 'prefer Gamma' });
    });

    it('EDGE: {header: ""} => parses, a question header may be empty', () => {
      const result = clarificationAnswerContract.parse({ header: '', labels: ['Option A'] });

      expect(result).toStrictEqual({ header: '', labels: ['Option A'] });
    });

    it('VALID: {extra key} => strips the unknown key', () => {
      const result = clarificationAnswerContract.parse({
        header: 'Database',
        labels: ['PostgreSQL'],
        extra: 'dropped',
      });

      expect(result).toStrictEqual({ header: 'Database', labels: ['PostgreSQL'] });
    });
  });

  describe('invalid answers', () => {
    it('INVALID: {labels: [], no text} => throws the nothing-to-send refusal', () => {
      expect(() => clarificationAnswerContract.parse({ header: 'Letters', labels: [] })).toThrow(
        /A clarification answer needs at least one label or non-blank text/u,
      );
    });

    it('INVALID: {labels: [], text: "   "} => throws too_small on the blank text', () => {
      expect(() =>
        clarificationAnswerContract.parse({ header: 'Letters', labels: [], text: '   ' }),
      ).toThrow(/too_small/u);
    });

    it('INVALID: {labels: [""]} => throws too_small', () => {
      expect(() => clarificationAnswerContract.parse({ header: 'Database', labels: [''] })).toThrow(
        /too_small/u,
      );
    });

    it('INVALID: {missing labels} => throws validation error', () => {
      expect(() => clarificationAnswerContract.parse({ header: 'Database' })).toThrow(
        /received undefined/u,
      );
    });

    it('INVALID: {missing header} => throws validation error', () => {
      expect(() => clarificationAnswerContract.parse({ labels: ['PostgreSQL'] })).toThrow(
        /received undefined/u,
      );
    });

    it('INVALID: {header: 5} => throws validation error', () => {
      expect(() =>
        clarificationAnswerContract.parse({ header: 5 as never, labels: ['PostgreSQL'] }),
      ).toThrow(/expected string/u);
    });
  });
});
