import { FrameOutcomeStub } from './frame-outcome.stub';
import { frameOutcomeContract } from './frame-outcome-contract';

describe('frameOutcomeContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = FrameOutcomeStub();

      expect(frameOutcomeContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {success: wrong type} => throws', () => {
      expect(() => frameOutcomeContract.parse({ ...FrameOutcomeStub(), success: 123 })).toThrow(
        /expected|invalid/iu,
      );
    });
  });
});
