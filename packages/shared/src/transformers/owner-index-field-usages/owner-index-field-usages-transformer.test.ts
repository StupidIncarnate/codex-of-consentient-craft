import { OwnerIndexFieldStub } from '../../contracts/owner-index-field/owner-index-field.stub';
import { OwnerIndexOwnerStub } from '../../contracts/owner-index-owner/owner-index-owner.stub';
import { OwnerIndexStub } from '../../contracts/owner-index/owner-index.stub';
import { ownerIndexFieldUsagesTransformer } from './owner-index-field-usages-transformer';

describe('ownerIndexFieldUsagesTransformer', () => {
  describe('valid input', () => {
    it('VALID: {questContract.id} => splits reuse, brand-ref and inline copy and skips the owner itself', () => {
      const ownerIndex = OwnerIndexStub({
        owners: [
          OwnerIndexOwnerStub({
            ownerName: 'Quest',
            contractName: 'questContract',
            filePath: '/repo/packages/a/src/contracts/quest/quest-contract.ts',
            fields: [OwnerIndexFieldStub({ key: 'id', kind: 'own-brand', brandText: 'QuestId' })],
          }),
          OwnerIndexOwnerStub({
            ownerName: 'Flow',
            contractName: 'flowContract',
            filePath: '/repo/packages/a/src/contracts/flow/flow-contract.ts',
            fields: [
              OwnerIndexFieldStub({
                key: 'questId',
                kind: 'owner-reuse',
                refContractName: 'questContract',
                refKey: 'id',
              }),
              OwnerIndexFieldStub({ key: 'id', kind: 'own-brand', brandText: 'FlowId' }),
            ],
          }),
          OwnerIndexOwnerStub({
            ownerName: 'StartInput',
            contractName: 'startInputContract',
            filePath: '/repo/packages/b/src/contracts/start-input/start-input-contract.ts',
            fields: [
              OwnerIndexFieldStub({ key: 'questId', kind: 'own-brand', brandText: 'QuestId' }),
            ],
          }),
          OwnerIndexOwnerStub({
            ownerName: 'Legacy',
            contractName: 'legacyContract',
            filePath: '/repo/packages/b/src/contracts/legacy/legacy-contract.ts',
            fields: [
              OwnerIndexFieldStub({ key: 'questId', kind: 'brand-ref', brandText: 'QuestId' }),
            ],
          }),
        ],
      });

      const result = ownerIndexFieldUsagesTransformer({
        ownerIndex,
        contractName: 'questContract',
        key: 'id',
      });

      expect(result).toStrictEqual([
        {
          filePath: '/repo/packages/a/src/contracts/flow/flow-contract.ts',
          contractName: 'flowContract',
          key: 'questId',
          kind: 'owner-reuse',
        },
        {
          filePath: '/repo/packages/b/src/contracts/start-input/start-input-contract.ts',
          contractName: 'startInputContract',
          key: 'questId',
          kind: 'inline-copy',
        },
        {
          filePath: '/repo/packages/b/src/contracts/legacy/legacy-contract.ts',
          contractName: 'legacyContract',
          key: 'questId',
          kind: 'brand-ref',
        },
      ]);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {contract nobody reuses} => returns no usages', () => {
      const ownerIndex = OwnerIndexStub({ owners: [OwnerIndexOwnerStub()] });

      expect(
        ownerIndexFieldUsagesTransformer({
          ownerIndex,
          contractName: 'thingContract',
          key: 'id',
        }),
      ).toStrictEqual([]);
    });
  });
});
