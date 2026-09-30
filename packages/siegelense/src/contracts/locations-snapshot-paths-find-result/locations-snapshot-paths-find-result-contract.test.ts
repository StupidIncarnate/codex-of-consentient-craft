import { LocationsSnapshotPathsFindResultStub } from './locations-snapshot-paths-find-result.stub';
import { locationsSnapshotPathsFindResultContract } from './locations-snapshot-paths-find-result-contract';

describe('locationsSnapshotPathsFindResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = LocationsSnapshotPathsFindResultStub();

      expect(locationsSnapshotPathsFindResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {storeDir: wrong type} => throws', () => {
      expect(() =>
        locationsSnapshotPathsFindResultContract.parse({
          ...LocationsSnapshotPathsFindResultStub(),
          storeDir: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
