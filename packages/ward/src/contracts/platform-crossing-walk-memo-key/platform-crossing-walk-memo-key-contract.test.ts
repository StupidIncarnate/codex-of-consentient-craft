import { platformCrossingWalkMemoKeyContract } from './platform-crossing-walk-memo-key-contract';
import { PlatformCrossingWalkMemoKeyStub } from './platform-crossing-walk-memo-key.stub';

describe('platformCrossingWalkMemoKeyContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: "/repo/shared.ts\\u0000all"} => parses successfully', () => {
      const result = platformCrossingWalkMemoKeyContract.parse(PlatformCrossingWalkMemoKeyStub());

      expect(result).toBe('/repo/shared.ts\u0000all');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {value: ""} => throws validation error', () => {
      expect(() => platformCrossingWalkMemoKeyContract.parse('')).toThrow(/at least 1/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates a walk memo key', () => {
      const result = PlatformCrossingWalkMemoKeyStub();

      expect(result).toBe('/repo/shared.ts\u0000all');
    });
  });
});
