import { RunPayloadOutcomeStub } from './run-payload-outcome.stub';
import { runPayloadOutcomeContract } from './run-payload-outcome-contract';

describe('runPayloadOutcomeContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = RunPayloadOutcomeStub();

      expect(runPayloadOutcomeContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {success: wrong type} => throws', () => {
      expect(() =>
        runPayloadOutcomeContract.parse({ ...RunPayloadOutcomeStub(), success: 123 }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
