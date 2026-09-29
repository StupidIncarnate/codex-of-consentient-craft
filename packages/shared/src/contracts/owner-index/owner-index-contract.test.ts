import { OwnerIndexEnumStub } from '../owner-index-enum/owner-index-enum.stub';
import { OwnerIndexOwnerStub } from '../owner-index-owner/owner-index-owner.stub';
import { OwnerIndexStub } from './owner-index.stub';
import { ownerIndexContract } from './owner-index-contract';

describe('ownerIndexContract', () => {
  describe('valid input', () => {
    it('EMPTY: {defaults} => returns an index with nothing in it', () => {
      expect(OwnerIndexStub()).toStrictEqual({
        owners: [],
        standaloneBrands: [],
        enums: [],
        packages: [],
      });
    });

    it('VALID: {one owner} => keeps the owner', () => {
      const owner = OwnerIndexOwnerStub();

      expect(ownerIndexContract.parse(OwnerIndexStub({ owners: [owner] })).owners).toStrictEqual([
        owner,
      ]);
    });

    it('VALID: {one enum} => keeps the enum', () => {
      const enumContract = OwnerIndexEnumStub();

      expect(
        ownerIndexContract.parse(OwnerIndexStub({ enums: [enumContract] })).enums,
      ).toStrictEqual([enumContract]);
    });
  });

  describe('invalid input', () => {
    it('INVALID: {enums: missing} => throws ZodError', () => {
      expect(() =>
        ownerIndexContract.parse({ owners: [], standaloneBrands: [], packages: [] }),
      ).toThrow(/expected array/iu);
    });
  });
});
