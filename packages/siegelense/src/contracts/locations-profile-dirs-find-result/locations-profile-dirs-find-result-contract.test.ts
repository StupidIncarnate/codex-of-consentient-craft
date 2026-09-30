import { LocationsProfileDirsFindResultStub } from './locations-profile-dirs-find-result.stub';
import { locationsProfileDirsFindResultContract } from './locations-profile-dirs-find-result-contract';

describe('locationsProfileDirsFindResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = LocationsProfileDirsFindResultStub();

      expect(locationsProfileDirsFindResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {samplesDir: wrong type} => throws', () => {
      expect(() =>
        locationsProfileDirsFindResultContract.parse({
          ...LocationsProfileDirsFindResultStub(),
          samplesDir: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
