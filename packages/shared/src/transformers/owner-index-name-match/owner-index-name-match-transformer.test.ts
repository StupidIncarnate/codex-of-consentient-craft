import { OwnerIndexFieldStub } from '../../contracts/owner-index-field/owner-index-field.stub';
import { OwnerIndexOwnerStub } from '../../contracts/owner-index-owner/owner-index-owner.stub';
import { OwnerIndexPackageStub } from '../../contracts/owner-index-package/owner-index-package.stub';
import { OwnerIndexStub } from '../../contracts/owner-index/owner-index.stub';
import { PackageNameStub } from '../../contracts/package-name/package-name.stub';
import { ownerIndexNameMatchTransformer } from './owner-index-name-match-transformer';

const alpha = PackageNameStub({ value: '@repo/alpha' });
const shared = PackageNameStub({ value: '@repo/shared' });
const stranger = PackageNameStub({ value: '@repo/stranger' });

const itemOwner = OwnerIndexOwnerStub({
  ownerName: 'Item',
  contractName: 'itemContract',
  packageName: shared,
  fields: [OwnerIndexFieldStub({ key: 'id', kind: 'own-brand', brandText: 'ItemId' })],
});
const workItemOwner = OwnerIndexOwnerStub({
  ownerName: 'WorkItem',
  contractName: 'workItemContract',
  packageName: shared,
  fields: [OwnerIndexFieldStub({ key: 'id', kind: 'own-brand', brandText: 'WorkItemId' })],
});
const questOwner = OwnerIndexOwnerStub({
  ownerName: 'Quest',
  contractName: 'questContract',
  packageName: shared,
  fields: [OwnerIndexFieldStub({ key: 'id', kind: 'own-brand', brandText: 'QuestId' })],
});
const packages = [
  OwnerIndexPackageStub({ name: alpha, dependencies: [shared] }),
  OwnerIndexPackageStub({ name: shared }),
  OwnerIndexPackageStub({ name: stranger }),
];

describe('ownerIndexNameMatchTransformer', () => {
  describe('longest owner wins', () => {
    it('VALID: {name: workItemId, owners Item and WorkItem} => resolves to WorkItem', () => {
      const ownerIndex = OwnerIndexStub({ owners: [itemOwner, workItemOwner], packages });

      const result = ownerIndexNameMatchTransformer({
        ownerIndex,
        packageName: alpha,
        name: 'workItemId',
      });

      expect(result?.owner.contractName).toBe('workItemContract');
      expect(result?.field.key).toBe('id');
    });

    it('VALID: {name: workItemId, owners listed WorkItem then Item} => still WorkItem', () => {
      const ownerIndex = OwnerIndexStub({ owners: [workItemOwner, itemOwner], packages });

      const result = ownerIndexNameMatchTransformer({
        ownerIndex,
        packageName: alpha,
        name: 'workItemId',
      });

      expect(result?.owner.contractName).toBe('workItemContract');
    });

    it('VALID: {name: itemId, owners Item and WorkItem} => resolves to Item', () => {
      const ownerIndex = OwnerIndexStub({ owners: [workItemOwner, itemOwner], packages });

      const result = ownerIndexNameMatchTransformer({
        ownerIndex,
        packageName: alpha,
        name: 'itemId',
      });

      expect(result?.owner.contractName).toBe('itemContract');
    });
  });

  describe('word boundaries', () => {
    it('VALID: {name: parentQuestId} => matches Quest.id', () => {
      const ownerIndex = OwnerIndexStub({ owners: [questOwner], packages });

      const result = ownerIndexNameMatchTransformer({
        ownerIndex,
        packageName: alpha,
        name: 'parentQuestId',
      });

      expect(result?.owner.contractName).toBe('questContract');
    });

    it('VALID: {name: requestId} => matches nothing, since its words are request, id', () => {
      const ownerIndex = OwnerIndexStub({ owners: [questOwner], packages });

      const result = ownerIndexNameMatchTransformer({
        ownerIndex,
        packageName: alpha,
        name: 'requestId',
      });

      expect(result).toBe(undefined);
    });
  });

  describe('reachability and claims', () => {
    it('VALID: {owner in a package alpha cannot reach} => does not claim the name', () => {
      const ownerIndex = OwnerIndexStub({
        owners: [OwnerIndexOwnerStub({ ...questOwner, packageName: stranger })],
        packages,
      });

      const result = ownerIndexNameMatchTransformer({
        ownerIndex,
        packageName: alpha,
        name: 'questId',
      });

      expect(result).toBe(undefined);
    });

    it('VALID: {owner whose id reuses another owner} => does not claim the name', () => {
      const reusing = OwnerIndexOwnerStub({
        ownerName: 'DeletableQuest',
        contractName: 'deletableQuestContract',
        packageName: shared,
        fields: [
          OwnerIndexFieldStub({
            key: 'id',
            kind: 'owner-reuse',
            refContractName: 'questContract',
            refKey: 'id',
          }),
        ],
      });
      const ownerIndex = OwnerIndexStub({ owners: [reusing], packages });

      const result = ownerIndexNameMatchTransformer({
        ownerIndex,
        packageName: alpha,
        name: 'deletableQuestId',
      });

      expect(result).toBe(undefined);
    });

    it('VALID: {same owner name in own and dependency package} => the file own package wins', () => {
      const local = OwnerIndexOwnerStub({
        ...questOwner,
        packageName: alpha,
        contractName: 'localQuestContract',
      });
      const ownerIndex = OwnerIndexStub({ owners: [questOwner, local], packages });

      const result = ownerIndexNameMatchTransformer({
        ownerIndex,
        packageName: alpha,
        name: 'questId',
      });

      expect(result?.owner.packageName).toBe('@repo/alpha');
    });
  });
});
