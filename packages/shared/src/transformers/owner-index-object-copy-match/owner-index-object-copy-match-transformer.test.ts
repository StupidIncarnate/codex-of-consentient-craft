import { ContentTextStub } from '../../contracts/content-text/content-text.stub';
import { IdentifierStub } from '../../contracts/identifier/identifier.stub';
import { OwnerIndexOwnerStub } from '../../contracts/owner-index-owner/owner-index-owner.stub';
import { OwnerIndexPackageStub } from '../../contracts/owner-index-package/owner-index-package.stub';
import { OwnerIndexStub } from '../../contracts/owner-index/owner-index.stub';
import { PackageNameStub } from '../../contracts/package-name/package-name.stub';
import { ownerIndexObjectCopyMatchTransformer } from './owner-index-object-copy-match-transformer';

const alpha = PackageNameStub({ value: '@repo/alpha' });
const shared = PackageNameStub({ value: '@repo/shared' });
const stranger = PackageNameStub({ value: '@repo/stranger' });

const addressOwner = OwnerIndexOwnerStub({
  ownerName: 'Address',
  contractName: 'addressContract',
  packageName: shared,
  schemaText: "z.object({\n  street: z.string().min(1).brand<'Street'>(),\n  city: z.string(),\n}).brand<'Address'>()",
});
const strangerOwner = OwnerIndexOwnerStub({
  ownerName: 'Hidden',
  contractName: 'hiddenContract',
  packageName: stranger,
  schemaText: 'z.object({ zip: z.string() })',
});
const ownerIndex = OwnerIndexStub({
  owners: [addressOwner, strangerOwner],
  packages: [
    OwnerIndexPackageStub({ name: alpha, dependencies: [shared] }),
    OwnerIndexPackageStub({ name: shared }),
    OwnerIndexPackageStub({ name: stranger }),
  ],
});
const contractName = IdentifierStub({ value: 'personContract' });

describe('ownerIndexObjectCopyMatchTransformer', () => {
  describe('copies', () => {
    it('VALID: {same keys and schemas with other brand texts, other spacing and key order} => returns the address owner', () => {
      const result = ownerIndexObjectCopyMatchTransformer({
        ownerIndex,
        packageName: alpha,
        contractName,
        objectText: "z.object({ city: z.string(), street: z.string().min(1).brand<'PersonStreet'>() })",
      });

      expect(result).toStrictEqual(addressOwner);
    });
  });

  describe('not copies', () => {
    it.each([
      ['a subset of the keys', "z.object({ street: z.string().min(1).brand<'S'>() })"],
      ['a key with another schema', 'z.object({ street: z.string(), city: z.string() })'],
      [
        'an extra key',
        'z.object({ street: z.string().min(1), city: z.string(), zip: z.string() })',
      ],
      ['no keys', 'z.object({})'],
      ['an owner in a package the file cannot reach', 'z.object({ zip: z.string() })'],
    ])('EMPTY: {%s} => returns undefined', (_label, value) => {
      const result = ownerIndexObjectCopyMatchTransformer({
        ownerIndex,
        packageName: alpha,
        contractName,
        objectText: ContentTextStub({ value }),
      });

      expect(result).toBe(undefined);
    });

    it('EMPTY: {the object sits inside the owner it would match} => returns undefined', () => {
      const result = ownerIndexObjectCopyMatchTransformer({
        ownerIndex,
        packageName: alpha,
        contractName: addressOwner.contractName,
        objectText: addressOwner.schemaText,
      });

      expect(result).toBe(undefined);
    });
  });
});
