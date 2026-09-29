import { OwnerIndexFieldStub } from './owner-index-field.stub';
import { ownerIndexFieldContract } from './owner-index-field-contract';

describe('ownerIndexFieldContract', () => {
  describe('valid input', () => {
    it('VALID: {defaults} => returns an own-brand id field', () => {
      expect(OwnerIndexFieldStub()).toStrictEqual({
        key: 'id',
        kind: 'own-brand',
        brandText: 'ThingId',
      });
    });

    it('VALID: {owner-reuse with ref} => keeps the referenced contract and key', () => {
      const result = ownerIndexFieldContract.parse({
        key: 'questId',
        kind: 'owner-reuse',
        refContractName: 'questContract',
        refKey: 'id',
      });

      expect(result).toStrictEqual({
        key: 'questId',
        kind: 'owner-reuse',
        refContractName: 'questContract',
        refKey: 'id',
      });
    });
  });

  describe('invalid input', () => {
    it('INVALID: {kind: unknown} => throws ZodError', () => {
      expect(() => ownerIndexFieldContract.parse({ key: 'id', kind: 'guess' })).toThrow(
        /Invalid option/u,
      );
    });
  });
});
