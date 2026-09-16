import { savedRecordNameContract } from './saved-record-name-contract';
import { SavedRecordNameStub } from './saved-record-name.stub';

describe('savedRecordNameContract', () => {
  describe('valid saved record names', () => {
    it('VALID: {value: "origin"} => returns "origin"', () => {
      expect(SavedRecordNameStub({ value: 'origin' })).toBe('origin');
    });
  });

  describe('invalid saved record names', () => {
    it('INVALID: {value: ""} => throws "String must contain at least 1 character(s)"', () => {
      expect(() => savedRecordNameContract.parse('')).toThrow(
        /String must contain at least 1 character\(s\)/u,
      );
    });
  });
});
