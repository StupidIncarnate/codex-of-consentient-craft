import { contractNameContract } from './contract-name-contract';
import { ContractNameStub } from './contract-name.stub';

describe('contractNameContract', () => {
  describe('valid names', () => {
    it('VALID: {value: "LoginCredentials"} => parses successfully', () => {
      const result = ContractNameStub({ value: 'LoginCredentials' });

      expect(result).toBe('LoginCredentials');
    });

    it('VALID: {value: "UserProfile"} => parses successfully', () => {
      const result = ContractNameStub({ value: 'UserProfile' });

      expect(result).toBe('UserProfile');
    });

    it('VALID: {value: "a"} => parses single character successfully', () => {
      const result = ContractNameStub({ value: 'a' });

      expect(result).toBe('a');
    });

    it('VALID: {default} => uses default LoginCredentials', () => {
      const result = ContractNameStub();

      expect(result).toBe('LoginCredentials');
    });
  });

  describe('invalid names', () => {
    it('INVALID_NAME: {value: ""} => throws validation error', () => {
      expect(() => {
        return contractNameContract.parse('');
      }).toThrow(/too_small/u);
    });

    it('INVALID_NAME: {value: number} => throws validation error', () => {
      expect(() => {
        return contractNameContract.parse(123 as never);
      }).toThrow(/Expected string/u);
    });
  });
});
