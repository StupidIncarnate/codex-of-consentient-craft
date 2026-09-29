import { OwnerIndexStandaloneBrandStub } from './owner-index-standalone-brand.stub';
import { ownerIndexStandaloneBrandContract } from './owner-index-standalone-brand-contract';

describe('ownerIndexStandaloneBrandContract', () => {
  describe('valid input', () => {
    it('VALID: {defaults} => returns the ThingId standalone brand', () => {
      expect(OwnerIndexStandaloneBrandStub()).toStrictEqual({
        contractName: 'thingIdContract',
        brandText: 'ThingId',
        filePath: '/repo/packages/example/src/contracts/thing-id/thing-id-contract.ts',
        packageName: '@repo/example',
      });
    });
  });

  describe('invalid input', () => {
    it('INVALID: {brandText: missing} => throws ZodError', () => {
      expect(() =>
        ownerIndexStandaloneBrandContract.parse({
          contractName: 'thingIdContract',
          filePath: '/repo/a-contract.ts',
          packageName: '@repo/a',
        }),
      ).toThrow(/expected string/iu);
    });
  });
});
