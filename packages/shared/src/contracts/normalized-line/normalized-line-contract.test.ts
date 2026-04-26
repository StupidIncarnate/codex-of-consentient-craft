import { normalizedLineContract } from './normalized-line-contract';
import { NormalizedLineStub } from './normalized-line.stub';

describe('normalizedLineContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: object} => parses object to NormalizedLine', () => {
      const result = normalizedLineContract.parse({ type: 'assistant' });

      expect(result).toStrictEqual({ type: 'assistant' });
    });

    it('VALID: {value: null} => parses null to NormalizedLine', () => {
      const result = normalizedLineContract.parse(null);

      expect(result).toStrictEqual(null);
    });

    it('VALID: {value: array} => parses array to NormalizedLine', () => {
      const result = normalizedLineContract.parse([1, 2, 3]);

      expect(result).toStrictEqual([1, 2, 3]);
    });
  });

  describe('stub', () => {
    it('VALID: NormalizedLineStub() => returns default stub value', () => {
      const result = NormalizedLineStub();

      expect(result).toStrictEqual({ type: 'assistant' });
    });

    it('VALID: NormalizedLineStub({value: custom}) => returns custom value', () => {
      const result = NormalizedLineStub({ value: { type: 'user', message: 'hello' } });

      expect(result).toStrictEqual({ type: 'user', message: 'hello' });
    });
  });
});
