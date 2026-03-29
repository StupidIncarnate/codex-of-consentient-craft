import { wardRunIdContract } from './ward-run-id-contract';
import { WardRunIdStub } from './ward-run-id.stub';

type WardRunId = ReturnType<typeof WardRunIdStub>;

describe('wardRunIdContract', () => {
  describe('valid ward run ids', () => {
    it('VALID: {value: numeric run id} => parses run id', () => {
      const result = wardRunIdContract.parse('1773805659495-6b06');

      expect(result).toBe('1773805659495-6b06');
    });

    it('VALID: {value: single character} => parses minimum valid string', () => {
      const result = wardRunIdContract.parse('x');

      expect(result).toBe('x');
    });
  });

  describe('stub', () => {
    it('VALID: stub default => returns default ward run id', () => {
      const runId: WardRunId = WardRunIdStub();

      expect(runId).toBe('1773805659495-stub');
    });

    it('VALID: stub with custom value => returns custom ward run id', () => {
      const runId: WardRunId = WardRunIdStub({ value: 'custom-run-id' });

      expect(runId).toBe('custom-run-id');
    });
  });

  describe('invalid ward run ids', () => {
    it('INVALID: {value: ""} => throws for empty string', () => {
      expect(() => wardRunIdContract.parse('')).toThrow(/too_small/u);
    });

    it('INVALID: {value: number} => throws for non-string type', () => {
      expect(() => wardRunIdContract.parse(123 as never)).toThrow(/Expected string/u);
    });

    it('INVALID: {value: null} => throws for null', () => {
      expect(() => wardRunIdContract.parse(null as never)).toThrow(/Expected string/u);
    });
  });
});
