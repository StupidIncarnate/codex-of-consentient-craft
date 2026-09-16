import { savedRefContract } from './saved-ref-contract';
import { SavedRefStub } from './saved-ref.stub';

describe('savedRefContract', () => {
  describe('valid saved refs', () => {
    it('VALID: {name: "origin", field: "sessionId"} => returns {__savedRef: true, name: "origin", field: "sessionId"}', () => {
      expect(SavedRefStub({ name: 'origin', field: 'sessionId' })).toStrictEqual({
        __savedRef: true,
        name: 'origin',
        field: 'sessionId',
      });
    });

    it('VALID: {name: "origin"} => returns the ref with no field key', () => {
      expect(SavedRefStub({ name: 'origin' })).toStrictEqual({
        __savedRef: true,
        name: 'origin',
      });
    });
  });

  describe('invalid saved refs', () => {
    it('INVALID: {name: ""} => throws "String must contain at least 1 character(s)"', () => {
      expect(() => savedRefContract.parse({ __savedRef: true, name: '' })).toThrow(
        /String must contain at least 1 character\(s\)/u,
      );
    });
  });
});
