import { OwnerIndexMatchStub } from './owner-index-match.stub';
import { ownerIndexMatchContract } from './owner-index-match-contract';

describe('ownerIndexMatchContract', () => {
  describe('valid input', () => {
    it('VALID: {defaults} => pairs the Thing owner with its id field', () => {
      const { owner, field } = ownerIndexMatchContract.parse(OwnerIndexMatchStub());

      expect({ ownerName: owner.ownerName, field }).toStrictEqual({
        ownerName: 'Thing',
        field: { key: 'id', kind: 'own-brand', brandText: 'ThingId' },
      });
    });
  });

  describe('invalid input', () => {
    it('INVALID: {field: missing} => throws ZodError', () => {
      expect(() => ownerIndexMatchContract.parse({ owner: OwnerIndexMatchStub().owner })).toThrow(
        /expected object/iu,
      );
    });
  });
});
