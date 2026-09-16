import { copiesTargetContract } from './copies-target-contract';
import { CopiesTargetStub } from './copies-target.stub';

describe('copiesTargetContract', () => {
  describe('valid copies targets', () => {
    it('VALID: {value: "questPersistBroker"} => returns "questPersistBroker"', () => {
      expect(CopiesTargetStub({ value: 'questPersistBroker' })).toBe('questPersistBroker');
    });
  });

  describe('invalid copies targets', () => {
    it('INVALID: {value: ""} => throws "String must contain at least 1 character(s)"', () => {
      expect(() => copiesTargetContract.parse('')).toThrow(
        /String must contain at least 1 character\(s\)/u,
      );
    });
  });
});
