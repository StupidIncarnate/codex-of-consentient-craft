import { IdentifierStub } from '../../contracts/identifier/identifier.stub';
import { OwnerIndexEnumStub } from '../../contracts/owner-index-enum/owner-index-enum.stub';
import { OwnerIndexOwnerStub } from '../../contracts/owner-index-owner/owner-index-owner.stub';
import { OwnerIndexPackageStub } from '../../contracts/owner-index-package/owner-index-package.stub';
import { OwnerIndexStub } from '../../contracts/owner-index/owner-index.stub';
import { PackageNameStub } from '../../contracts/package-name/package-name.stub';
import { ownerIndexEnumCopyMatchTransformer } from './owner-index-enum-copy-match-transformer';

const alpha = PackageNameStub({ value: '@repo/alpha' });
const shared = PackageNameStub({ value: '@repo/shared' });
const stranger = PackageNameStub({ value: '@repo/stranger' });

const statusEnum = OwnerIndexEnumStub({
  ownerName: 'QuestStatus',
  contractName: 'questStatusContract',
  packageName: shared,
  values: ['done', 'open'],
});
const strangerEnum = OwnerIndexEnumStub({
  ownerName: 'Secret',
  contractName: 'secretContract',
  packageName: stranger,
  values: ['hidden', 'shown'],
});
const workItemOwner = OwnerIndexOwnerStub({
  ownerName: 'WorkItem',
  contractName: 'workItemContract',
  packageName: shared,
  schemaText: "z.object({ role: z.enum(['worker', 'admin']), title: z.string() })",
});
const packages = [
  OwnerIndexPackageStub({ name: alpha, dependencies: [shared] }),
  OwnerIndexPackageStub({ name: shared }),
  OwnerIndexPackageStub({ name: stranger }),
];
const ownerIndex = OwnerIndexStub({
  owners: [workItemOwner],
  enums: [strangerEnum, statusEnum],
  packages,
});
const contractName = IdentifierStub({ value: 'personContract' });

describe('ownerIndexEnumCopyMatchTransformer', () => {
  describe('standalone enum contracts', () => {
    it('VALID: {same values in another order} => returns the reachable enum contract', () => {
      const result = ownerIndexEnumCopyMatchTransformer({
        ownerIndex,
        packageName: alpha,
        contractName,
        enumText: "z.enum(['open', 'done'])",
      });

      expect(result).toStrictEqual(statusEnum);
    });

    it('VALID: {a standalone enum and an inline enum share the values} => the standalone enum wins', () => {
      const result = ownerIndexEnumCopyMatchTransformer({
        ownerIndex: OwnerIndexStub({
          owners: [
            OwnerIndexOwnerStub({
              ownerName: 'Task',
              contractName: 'taskContract',
              packageName: shared,
              schemaText: "z.object({ state: z.enum(['open', 'done']) })",
            }),
          ],
          enums: [statusEnum],
          packages,
        }),
        packageName: alpha,
        contractName,
        enumText: "z.enum(['done', 'open'])",
      });

      expect(result).toStrictEqual(statusEnum);
    });

    it('EMPTY: {the enum being checked is the indexed contract} => returns undefined', () => {
      const result = ownerIndexEnumCopyMatchTransformer({
        ownerIndex,
        packageName: alpha,
        contractName: statusEnum.contractName,
        enumText: "z.enum(['done', 'open'])",
      });

      expect(result).toBe(undefined);
    });

    it('EMPTY: {same values as an enum in a package the file cannot reach} => returns undefined', () => {
      const result = ownerIndexEnumCopyMatchTransformer({
        ownerIndex,
        packageName: alpha,
        contractName,
        enumText: "z.enum(['shown', 'hidden'])",
      });

      expect(result).toBe(undefined);
    });
  });

  describe('inline enums in other contracts', () => {
    it('VALID: {same values as work item role} => returns the inline enum with its owner and key', () => {
      const result = ownerIndexEnumCopyMatchTransformer({
        ownerIndex,
        packageName: alpha,
        contractName,
        enumText: "z.enum(['admin', 'worker']).brand<'Role'>()",
      });

      expect(result).toStrictEqual({
        ownerName: 'WorkItem',
        contractName: 'workItemContract',
        filePath: workItemOwner.filePath,
        packageName: '@repo/shared',
        key: 'role',
        values: ['admin', 'worker'],
      });
    });

    it('EMPTY: {the enum is inside the contract that holds the inline copy} => returns undefined', () => {
      const result = ownerIndexEnumCopyMatchTransformer({
        ownerIndex,
        packageName: alpha,
        contractName: workItemOwner.contractName,
        enumText: "z.enum(['admin', 'worker'])",
      });

      expect(result).toBe(undefined);
    });
  });

  describe('no match', () => {
    it('EMPTY: {values nobody else declares} => returns undefined', () => {
      const result = ownerIndexEnumCopyMatchTransformer({
        ownerIndex,
        packageName: alpha,
        contractName,
        enumText: "z.enum(['left', 'right'])",
      });

      expect(result).toBe(undefined);
    });

    it('EMPTY: {an enum over a variable} => returns undefined', () => {
      const result = ownerIndexEnumCopyMatchTransformer({
        ownerIndex,
        packageName: alpha,
        contractName,
        enumText: 'z.enum(values)',
      });

      expect(result).toBe(undefined);
    });
  });
});
