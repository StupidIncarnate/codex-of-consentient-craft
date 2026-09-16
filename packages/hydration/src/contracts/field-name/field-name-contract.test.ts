import { fieldNameContract } from './field-name-contract';
import { FieldNameStub } from './field-name.stub';

describe('fieldNameContract', () => {
  describe('valid field names', () => {
    it('VALID: {value: "status"} => returns "status"', () => {
      expect(FieldNameStub({ value: 'status' })).toBe('status');
    });
  });

  describe('invalid field names', () => {
    it('INVALID: {value: ""} => throws "String must contain at least 1 character(s)"', () => {
      expect(() => fieldNameContract.parse('')).toThrow(
        /String must contain at least 1 character\(s\)/u,
      );
    });
  });
});
