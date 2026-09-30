import { OwnerIndexFieldStub } from '../../contracts/owner-index-field/owner-index-field.stub';
import { OwnerIndexOwnerStub } from '../../contracts/owner-index-owner/owner-index-owner.stub';
import { OwnerIndexStub } from '../../contracts/owner-index/owner-index.stub';
import { ownerIndexBrandDeclarersTransformer } from './owner-index-brand-declarers-transformer';

describe('ownerIndexBrandDeclarersTransformer', () => {
  describe('valid input', () => {
    it('VALID: {QuestId declared by an own brand and a brand-ref} => returns both, not the plain field', () => {
      const ownerIndex = OwnerIndexStub({
        owners: [
          OwnerIndexOwnerStub({
            ownerName: 'Quest',
            contractName: 'questContract',
            fields: [OwnerIndexFieldStub({ key: 'id', kind: 'own-brand', brandText: 'QuestId' })],
          }),
          OwnerIndexOwnerStub({
            ownerName: 'DeletableQuest',
            contractName: 'deletableQuestContract',
            fields: [
              OwnerIndexFieldStub({ key: 'id', kind: 'brand-ref', brandText: 'QuestId' }),
              OwnerIndexFieldStub({ key: 'title', kind: 'plain' }),
            ],
          }),
        ],
      });

      const result = ownerIndexBrandDeclarersTransformer({
        ownerIndex,
        brandText: 'QuestId',
      });

      expect(
        result.map(({ owner, field }) => [owner.contractName, field.key, field.kind]),
      ).toStrictEqual([
        ['questContract', 'id', 'own-brand'],
        ['deletableQuestContract', 'id', 'brand-ref'],
      ]);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {brand nobody declares} => returns no matches', () => {
      const ownerIndex = OwnerIndexStub({ owners: [OwnerIndexOwnerStub()] });

      expect(
        ownerIndexBrandDeclarersTransformer({
          ownerIndex,
          brandText: 'NobodyId',
        }),
      ).toStrictEqual([]);
    });
  });
});
