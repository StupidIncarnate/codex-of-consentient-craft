import { SignalExtractorStub } from './signal-extractor.stub';
import { signalExtractorContract } from './signal-extractor-contract';

describe('signalExtractorContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = SignalExtractorStub();

      expect(signalExtractorContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {signal: wrong type} => throws', () => {
      expect(() =>
        signalExtractorContract.parse({ ...SignalExtractorStub(), signal: 123 }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
