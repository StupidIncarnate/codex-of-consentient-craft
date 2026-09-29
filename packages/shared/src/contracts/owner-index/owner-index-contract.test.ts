import { OwnerIndexOwnerStub } from '../owner-index-owner/owner-index-owner.stub';
import { OwnerIndexStub } from './owner-index.stub';
import { ownerIndexContract } from './owner-index-contract';

describe('ownerIndexContract', () => {
  describe('valid input', () => {
    it('EMPTY: {defaults} => returns an index with nothing in it', () => {
      expect(OwnerIndexStub()).toStrictEqual({ owners: [], standaloneBrands: [], packages: [] });
    });

    it('VALID: {one owner} => keeps the owner', () => {
      const owner = OwnerIndexOwnerStub();

      expect(ownerIndexContract.parse(OwnerIndexStub({ owners: [owner] })).owners).toStrictEqual([
        owner,
      ]);
    });
  });
});
