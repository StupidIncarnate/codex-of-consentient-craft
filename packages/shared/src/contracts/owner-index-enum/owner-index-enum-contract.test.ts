import { OwnerIndexEnumStub } from './owner-index-enum.stub';
import { ownerIndexEnumContract } from './owner-index-enum-contract';

describe('ownerIndexEnumContract', () => {
  describe('valid input', () => {
    it('VALID: {defaults} => returns the ThingKind enum with its sorted values', () => {
      expect(OwnerIndexEnumStub()).toStrictEqual({
        ownerName: 'ThingKind',
        contractName: 'thingKindContract',
        filePath: '/repo/packages/example/src/contracts/thing-kind/thing-kind-contract.ts',
        packageName: '@repo/example',
        values: ['large', 'small'],
      });
    });

    it('VALID: {values: []} => keeps an empty value list', () => {
      expect(OwnerIndexEnumStub({ values: [] }).values).toStrictEqual([]);
    });
  });

  describe('inline enums', () => {
    it("VALID: {key: 'role'} => keeps the key an inline enum sits under", () => {
      expect(OwnerIndexEnumStub({ key: 'role' }).key).toBe('role');
    });
  });

  describe('invalid input', () => {
    it('INVALID: {values: missing} => throws ZodError', () => {
      expect(() =>
        ownerIndexEnumContract.parse({
          ownerName: 'ThingKind',
          contractName: 'thingKindContract',
          filePath: '/repo/a-contract.ts',
          packageName: '@repo/a',
        }),
      ).toThrow(/expected array/iu);
    });
  });
});
