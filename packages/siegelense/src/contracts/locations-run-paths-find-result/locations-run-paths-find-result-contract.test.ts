import { LocationsRunPathsFindResultStub } from './locations-run-paths-find-result.stub';
import { locationsRunPathsFindResultContract } from './locations-run-paths-find-result-contract';

describe('locationsRunPathsFindResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = LocationsRunPathsFindResultStub();

      expect(locationsRunPathsFindResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {transcript: wrong type} => throws', () => {
      expect(() =>
        locationsRunPathsFindResultContract.parse({
          ...LocationsRunPathsFindResultStub(),
          transcript: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
