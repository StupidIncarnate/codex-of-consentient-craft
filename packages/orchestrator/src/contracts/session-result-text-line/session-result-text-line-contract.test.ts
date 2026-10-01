import { sessionResultTextLineContract } from './session-result-text-line-contract';
import { SessionResultTextLineStub } from './session-result-text-line.stub';

describe('sessionResultTextLineContract', () => {
  describe('valid result lines', () => {
    it('VALID: {default stub} => parses the final text', () => {
      const line = SessionResultTextLineStub();

      expect(sessionResultTextLineContract.parse(line)).toStrictEqual({
        type: 'result',
        result: 'Work recorded and signalled.',
      });
    });

    it('VALID: {result line carrying cost and duration} => strips them and keeps the text', () => {
      expect(
        sessionResultTextLineContract.parse({
          type: 'result',
          subtype: 'success',
          result: 'ok',
          duration_ms: 1500,
        }),
      ).toStrictEqual({ type: 'result', result: 'ok' });
    });
  });

  describe('invalid lines', () => {
    it('INVALID: {type: "assistant"} => throws', () => {
      expect(() =>
        sessionResultTextLineContract.parse({ type: 'assistant', result: 'ok' }),
      ).toThrow(/Invalid input: expected \\"result\\"/u);
    });

    it('INVALID: {result line with no result text} => throws', () => {
      expect(() => sessionResultTextLineContract.parse({ type: 'result' })).toThrow(
        /received undefined/u,
      );
    });
  });
});
