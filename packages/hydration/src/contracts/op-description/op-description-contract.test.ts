import { opDescriptionContract } from './op-description-contract';
import { OpDescriptionStub } from './op-description.stub';

describe('opDescriptionContract', () => {
  describe('a real description', () => {
    it('VALID: {value: "create quest[0:1]"} => returns "create quest[0:1]"', () => {
      expect(OpDescriptionStub({ value: 'create quest[0:1]' })).toBe('create quest[0:1]');
    });
  });

  describe('an empty description', () => {
    it('INVALID: {value: ""} => throws "String must contain at least 1 character(s)"', () => {
      expect(() => opDescriptionContract.parse('')).toThrow(
        /String must contain at least 1 character\(s\)/u,
      );
    });
  });
});
