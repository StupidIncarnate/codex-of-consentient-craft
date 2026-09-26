import { exportedNameContract } from './exported-name-contract';
import { ExportedNameStub } from './exported-name.stub';

describe('exportedNameContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: "userFetchBroker"} => parses successfully', () => {
      const result = exportedNameContract.parse(ExportedNameStub());

      expect(result).toBe('userFetchBroker');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {value: ""} => throws validation error', () => {
      expect(() => exportedNameContract.parse('')).toThrow(/at least 1/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates an exported name', () => {
      const result = ExportedNameStub();

      expect(result).toBe('userFetchBroker');
    });
  });
});
