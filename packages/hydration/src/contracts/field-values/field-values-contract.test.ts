import { fieldValuesContract } from './field-values-contract';
import { FieldValuesStub } from './field-values.stub';
import { SavedRefStub } from '../saved-ref/saved-ref.stub';

describe('fieldValuesContract', () => {
  describe('valid field values', () => {
    it('VALID: {title: "The running one"} => returns {title: "The running one"}', () => {
      expect(FieldValuesStub({ title: 'The running one' })).toStrictEqual({
        title: 'The running one',
      });
    });

    it('VALID: {userRequest: a SavedRef} => returns the ref unchanged', () => {
      const savedRef = SavedRefStub({ name: 'origin' });

      expect(FieldValuesStub({ userRequest: savedRef })).toStrictEqual({
        userRequest: savedRef,
      });
    });

    it('VALID: {meta: {nested: "value"}} => returns the object unchanged, marker absent', () => {
      expect(FieldValuesStub({ meta: { nested: 'value' } })).toStrictEqual({
        meta: { nested: 'value' },
      });
    });
  });

  describe('invalid field values', () => {
    it('INVALID: {"": "x"} => throws "String must contain at least 1 character(s)"', () => {
      expect(() => fieldValuesContract.parse({ '': 'x' })).toThrow(
        /String must contain at least 1 character\(s\)/u,
      );
    });

    it('INVALID: {userRequest: {__savedRef: true}} => throws naming the missing name field', () => {
      expect(() => fieldValuesContract.parse({ userRequest: { __savedRef: true } })).toThrow(
        /"path":\s*\[\s*"userRequest",\s*"name"\s*\][\s\S]*"message":\s*"Required"/u,
      );
    });
  });
});
