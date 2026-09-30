import { LocationsBufferPathsFindResultStub } from './locations-buffer-paths-find-result.stub';
import { locationsBufferPathsFindResultContract } from './locations-buffer-paths-find-result-contract';

describe('locationsBufferPathsFindResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = LocationsBufferPathsFindResultStub();

      expect(locationsBufferPathsFindResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {console: wrong type} => throws', () => {
      expect(() =>
        locationsBufferPathsFindResultContract.parse({
          ...LocationsBufferPathsFindResultStub(),
          console: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
