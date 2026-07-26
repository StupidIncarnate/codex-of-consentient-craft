import { mockHandleContract } from './mock-handle-contract';
import { MockHandleStub } from './mock-handle.stub';

describe('mockHandleContract', () => {
  describe('valid data', () => {
    it('VALID: {} => parses empty object', () => {
      const result = mockHandleContract.parse({});

      expect(result).toStrictEqual({});
    });
  });

  describe('MockHandleStub', () => {
    it('VALID: {defaults} => creates MockHandle with all methods', () => {
      const handle = MockHandleStub();

      expect(handle).toStrictEqual({
        calledWith: expect.any(Function),
        onceFor: expect.any(Function),
        callsMatching: expect.any(Function),
      });
    });

    it('VALID: {custom callsMatching} => creates MockHandle with overridden method', () => {
      const customCallsMatching = (): unknown[][] => [];
      const handle = MockHandleStub({ callsMatching: customCallsMatching });

      expect(handle.callsMatching).toBe(customCallsMatching);
    });
  });
});
