import { typescriptStatementContract } from './typescript-statement-contract';
import { TypescriptStatementStub } from './typescript-statement.stub';

describe('typescriptStatementContract', () => {
  describe('valid statements', () => {
    it('VALID: {any value} => returns TypescriptStatement', () => {
      const result = typescriptStatementContract.parse(undefined);

      expect(result).toBeUndefined();
    });
  });

  describe('TypescriptStatementStub', () => {
    it('VALID: {value: undefined} => returns TypescriptStatement', () => {
      const result = TypescriptStatementStub({ value: undefined });

      expect(result).toBeUndefined();
    });
  });
});
