import { clarificationAnswerContract } from './clarification-answer-contract';
import { ClarificationAnswerStub } from './clarification-answer.stub';

describe('clarificationAnswerContract', () => {
  describe('valid answers', () => {
    it('VALID: {header, label} => parses both fields', () => {
      const answer = ClarificationAnswerStub({ header: 'Database', label: 'PostgreSQL' });

      const result = clarificationAnswerContract.parse(answer);

      expect(result).toStrictEqual({ header: 'Database', label: 'PostgreSQL' });
    });

    it('VALID: {default stub} => parses the stub values', () => {
      const result = clarificationAnswerContract.parse(ClarificationAnswerStub());

      expect(result).toStrictEqual({ header: 'Architecture Choice', label: 'Option A' });
    });

    it('EDGE: {header: ""} => parses, a question header may be empty', () => {
      const result = clarificationAnswerContract.parse({ header: '', label: 'Option A' });

      expect(result).toStrictEqual({ header: '', label: 'Option A' });
    });

    it('VALID: {extra key} => strips the unknown key', () => {
      const result = clarificationAnswerContract.parse({
        header: 'Database',
        label: 'PostgreSQL',
        extra: 'dropped',
      });

      expect(result).toStrictEqual({ header: 'Database', label: 'PostgreSQL' });
    });
  });

  describe('invalid answers', () => {
    it('INVALID: {label: ""} => throws too_small', () => {
      expect(() => clarificationAnswerContract.parse({ header: 'Database', label: '' })).toThrow(
        /too_small/u,
      );
    });

    it('INVALID: {missing header} => throws validation error', () => {
      expect(() => clarificationAnswerContract.parse({ label: 'PostgreSQL' })).toThrow(
        /received undefined/u,
      );
    });

    it('INVALID: {header: 5} => throws validation error', () => {
      expect(() =>
        clarificationAnswerContract.parse({ header: 5 as never, label: 'PostgreSQL' }),
      ).toThrow(/expected string/u);
    });
  });
});
