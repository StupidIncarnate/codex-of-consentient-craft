import { contractPathToStubPathTransformer } from './contract-path-to-stub-path-transformer';

describe('contractPathToStubPathTransformer', () => {
  describe('converting contract path to stub path', () => {
    it('VALID: {contractPath: "user-contract"} => returns "user.stub"', () => {
      const result = contractPathToStubPathTransformer({ contractPath: 'user-contract' });

      expect(result).toBe('user.stub');
    });

    it('VALID: {contractPath: "user-contract.ts"} => returns "user.stub"', () => {
      const result = contractPathToStubPathTransformer({ contractPath: 'user-contract.ts' });

      expect(result).toBe('user.stub');
    });

    it('VALID: {contractPath: "./user-contract"} => returns "./user.stub"', () => {
      const result = contractPathToStubPathTransformer({ contractPath: './user-contract' });

      expect(result).toBe('./user.stub');
    });

    it('VALID: {contractPath: "../contracts/user-contract"} => returns "../contracts/user.stub"', () => {
      const result = contractPathToStubPathTransformer({
        contractPath: '../contracts/user-contract',
      });

      expect(result).toBe('../contracts/user.stub');
    });
  });

  describe('edge cases', () => {
    it('VALID: {contractPath: "contract"} => returns "contract"', () => {
      const result = contractPathToStubPathTransformer({ contractPath: 'contract' });

      expect(result).toBe('contract');
    });

    it('VALID: {contractPath: "user-contract-contract"} => returns "user-contract.stub"', () => {
      const result = contractPathToStubPathTransformer({
        contractPath: 'user-contract-contract',
      });

      expect(result).toBe('user-contract.stub');
    });

    it('EDGE: {contractPath: "user-contract.ts.ts"} => returns "user-contract.ts.ts"', () => {
      const result = contractPathToStubPathTransformer({
        contractPath: 'user-contract.ts.ts',
      });

      // No match because pattern requires -contract or -contract.ts at END
      expect(result).toBe('user-contract.ts.ts');
    });
  });
});
