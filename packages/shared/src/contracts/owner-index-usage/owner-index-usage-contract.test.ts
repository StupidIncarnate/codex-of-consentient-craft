import { OwnerIndexUsageStub } from './owner-index-usage.stub';
import { ownerIndexUsageContract } from './owner-index-usage-contract';

describe('ownerIndexUsageContract', () => {
  describe('valid input', () => {
    it('VALID: {defaults} => returns an owner-reuse usage', () => {
      expect(OwnerIndexUsageStub()).toStrictEqual({
        filePath: '/repo/packages/example/src/contracts/other/other-contract.ts',
        contractName: 'otherContract',
        key: 'thingId',
        kind: 'owner-reuse',
      });
    });
  });

  describe('invalid input', () => {
    it('INVALID: {kind: plain} => throws ZodError', () => {
      expect(() =>
        ownerIndexUsageContract.parse({ ...OwnerIndexUsageStub(), kind: 'plain' }),
      ).toThrow(/Invalid option/u);
    });
  });
});
