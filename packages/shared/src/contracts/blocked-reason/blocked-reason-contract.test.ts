import { blockedReasonContract } from './blocked-reason-contract';
import { BlockedReasonStub } from './blocked-reason.stub';

describe('blockedReasonContract', () => {
  describe('valid reasons', () => {
    it('VALID: {value: permission wall sentence} => returns branded reason', () => {
      const result = blockedReasonContract.parse(
        'git add is permission-denied in this dispatched session',
      );

      expect(result).toBe(
        BlockedReasonStub({ value: 'git add is permission-denied in this dispatched session' }),
      );
    });

    it('EDGE: {value: single character} => returns branded reason at the minimum length', () => {
      const result = blockedReasonContract.parse('x');

      expect(result).toBe(BlockedReasonStub({ value: 'x' }));
    });
  });

  describe('invalid reasons', () => {
    it('EMPTY: {value: ""} => throws because a blocked signal must say why', () => {
      expect(() => blockedReasonContract.parse('')).toThrow(
        /expected string to have >=1 characters/u,
      );
    });

    it('INVALID: {value: 123} => throws Expected string', () => {
      expect(() => blockedReasonContract.parse(123)).toThrow(/expected string/u);
    });

    it('EMPTY: {value: undefined} => throws Required', () => {
      expect(() => blockedReasonContract.parse(undefined)).toThrow(/received undefined/u);
    });
  });
});
