import { mockStagingContract } from './mock-staging-contract';
import { MockStagingStub } from './mock-staging.stub';

describe('mockStagingContract', () => {
  describe('valid data', () => {
    it('VALID: {} => parses empty object', () => {
      const result = mockStagingContract.parse({});

      expect(result).toStrictEqual({});
    });
  });

  describe('MockStagingStub', () => {
    it('VALID: {defaults} => creates MockStaging with all methods', () => {
      const staging = MockStagingStub();

      expect(staging).toStrictEqual({
        returns: expect.any(Function),
        resolves: expect.any(Function),
        rejects: expect.any(Function),
        throws: expect.any(Function),
        implement: expect.any(Function),
      });
    });

    it('VALID: {custom returns} => creates MockStaging with overridden method', () => {
      const customReturns = (): void => undefined;
      const staging = MockStagingStub({ returns: customReturns });

      expect(staging.returns).toBe(customReturns);
    });
  });
});
