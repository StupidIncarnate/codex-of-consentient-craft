import { platformCrossingChainHopContract } from './platform-crossing-chain-hop-contract';
import { PlatformCrossingChainHopStub } from './platform-crossing-chain-hop.stub';

describe('platformCrossingChainHopContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: "@dungeonmaster/node/fs"} => parses successfully', () => {
      const result = platformCrossingChainHopContract.parse(PlatformCrossingChainHopStub());

      expect(result).toBe('@dungeonmaster/node/fs');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {value: ""} => throws validation error', () => {
      expect(() => platformCrossingChainHopContract.parse('')).toThrow(/>=1/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates a chain hop', () => {
      const result = PlatformCrossingChainHopStub();

      expect(result).toBe('@dungeonmaster/node/fs');
    });
  });
});
