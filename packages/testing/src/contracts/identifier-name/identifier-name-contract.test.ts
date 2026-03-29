import { identifierNameContract } from './identifier-name-contract';
import { IdentifierNameStub } from './identifier-name.stub';

describe('identifierNameContract', () => {
  describe('valid identifier names', () => {
    it('VALID: {value: "execFile"} => parses successfully', () => {
      const identifierName = IdentifierNameStub({ value: 'execFile' });

      const result = identifierNameContract.parse(identifierName);

      expect(result).toBe('execFile');
    });

    it('VALID: {value: "fs"} => parses single word identifier', () => {
      const identifierName = IdentifierNameStub({ value: 'fs' });

      const result = identifierNameContract.parse(identifierName);

      expect(result).toBe('fs');
    });

    it('VALID: {value: "spawn"} => parses successfully', () => {
      const identifierName = IdentifierNameStub({ value: 'spawn' });

      const result = identifierNameContract.parse(identifierName);

      expect(result).toBe('spawn');
    });
  });

  describe('invalid identifier names', () => {
    it('INVALID: {value: ""} => throws validation error', () => {
      expect(() => {
        return identifierNameContract.parse('');
      }).toThrow(/String must contain at least 1 character/u);
    });
  });
});
