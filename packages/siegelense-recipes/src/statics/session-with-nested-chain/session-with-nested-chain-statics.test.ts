import { sessionWithNestedChainStatics } from './session-with-nested-chain-statics';

describe('sessionWithNestedChainStatics', () => {
  describe('counts', () => {
    it('VALID: {} => depth is 2', () => {
      expect(sessionWithNestedChainStatics.counts).toStrictEqual({ depth: 2 });
    });
  });
});
