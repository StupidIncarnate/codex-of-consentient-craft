import { importedNameContract } from './imported-name-contract';
import { ImportedNameStub } from './imported-name.stub';

describe('importedNameContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: "readFileIfExists"} => parses successfully', () => {
      const result = importedNameContract.parse(ImportedNameStub());

      expect(result).toBe('readFileIfExists');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {value: ""} => throws validation error', () => {
      expect(() => importedNameContract.parse('')).toThrow(/>=1/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates an imported name', () => {
      const result = ImportedNameStub();

      expect(result).toBe('readFileIfExists');
    });
  });
});
