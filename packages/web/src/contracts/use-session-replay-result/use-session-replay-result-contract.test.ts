import { UseSessionReplayResultStub } from './use-session-replay-result.stub';
import { useSessionReplayResultContract } from './use-session-replay-result-contract';

describe('useSessionReplayResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = UseSessionReplayResultStub();

      expect(useSessionReplayResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {entries: wrong type} => throws', () => {
      expect(() =>
        useSessionReplayResultContract.parse({ ...UseSessionReplayResultStub(), entries: 123 }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
