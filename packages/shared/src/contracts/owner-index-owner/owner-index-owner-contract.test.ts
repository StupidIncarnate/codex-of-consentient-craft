import { OwnerIndexOwnerStub } from './owner-index-owner.stub';
import { ownerIndexOwnerContract } from './owner-index-owner-contract';

describe('ownerIndexOwnerContract', () => {
  describe('valid input', () => {
    it('VALID: {defaults} => returns one owner with one own-brand id', () => {
      expect(OwnerIndexOwnerStub()).toStrictEqual({
        ownerName: 'Thing',
        contractName: 'thingContract',
        filePath: '/repo/packages/example/src/contracts/thing/thing-contract.ts',
        packageName: '@repo/example',
        typeName: 'Thing',
        schemaText: "z.object({ id: z.string().brand<'ThingId'>() })",
        fields: [{ key: 'id', kind: 'own-brand', brandText: 'ThingId' }],
      });
    });
  });

  describe('invalid input', () => {
    it('INVALID: {filePath: relative} => throws ZodError', () => {
      expect(() =>
        ownerIndexOwnerContract.parse({ ...OwnerIndexOwnerStub(), filePath: 'a/b-contract.ts' }),
      ).toThrow(/Path must be absolute/u);
    });
  });
});
