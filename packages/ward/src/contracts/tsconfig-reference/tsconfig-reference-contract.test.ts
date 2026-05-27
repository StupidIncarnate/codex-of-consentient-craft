import { tsconfigReferenceContract } from './tsconfig-reference-contract';
import { TsconfigReferenceStub } from './tsconfig-reference.stub';

describe('tsconfigReferenceContract', () => {
  describe('valid input', () => {
    it('VALID: {path: "../shared"} => returns branded object', () => {
      const result = TsconfigReferenceStub({ path: '../shared' });

      expect(String(result.path)).toBe('../shared');
    });

    it('VALID: {path: "./packages/orchestrator"} => returns branded object', () => {
      const result = TsconfigReferenceStub({ path: './packages/orchestrator' });

      expect(String(result.path)).toBe('./packages/orchestrator');
    });
  });

  describe('invalid input', () => {
    it('INVALID: {path: 42} => throws Expected string', () => {
      expect(() => tsconfigReferenceContract.parse({ path: 42 })).toThrow(/Expected string/u);
    });

    it('INVALID: {} => throws (missing path)', () => {
      expect(() => tsconfigReferenceContract.parse({})).toThrow(/Required/u);
    });
  });
});
