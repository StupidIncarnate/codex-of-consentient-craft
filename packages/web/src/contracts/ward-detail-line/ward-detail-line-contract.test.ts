import { wardDetailLineContract } from './ward-detail-line-contract';
import { WardDetailLineStub } from './ward-detail-line.stub';

describe('wardDetailLineContract', () => {
  describe('valid input', () => {
    it('VALID: {value: line string} => returns branded WardDetailLine', () => {
      const result = wardDetailLineContract.parse(
        'unit: src/foo.test.ts › does a thing — expected true',
      );

      expect(result).toBe('unit: src/foo.test.ts › does a thing — expected true');
    });

    it('VALID: {stub default} => returns branded WardDetailLine', () => {
      const result = WardDetailLineStub();

      expect(result).toBe('lint: packages/web/src/index.ts:10 — Unexpected any');
    });
  });

  describe('invalid input', () => {
    it('INVALID: {value: number} => throws', () => {
      expect(() => wardDetailLineContract.parse(123 as never)).toThrow(/Expected string/u);
    });
  });
});
