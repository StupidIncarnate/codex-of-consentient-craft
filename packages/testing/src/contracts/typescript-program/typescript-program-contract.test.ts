import { typescriptProgramContract } from './typescript-program-contract';
import { TypescriptProgramStub } from './typescript-program.stub';

describe('typescriptProgramContract', () => {
  describe('valid programs', () => {
    it('VALID: {unknown value} => returns TypescriptProgram', () => {
      const result = typescriptProgramContract.parse(undefined);

      expect(result).toBe(undefined);
    });
  });

  describe('TypescriptProgramStub', () => {
    it('VALID: {value: undefined} => returns TypescriptProgram', () => {
      const result = TypescriptProgramStub({ value: undefined });

      expect(result).toBe(undefined);
    });
  });
});
