import { mockHandleEntryContract } from './mock-handle-entry-contract';
import { MockHandleEntryStub } from './mock-handle-entry.stub';

describe('mockHandleEntryContract', () => {
  describe('valid entries', () => {
    it('VALID: {default stub} => parses successfully', () => {
      const entry = MockHandleEntryStub();

      const result = mockHandleEntryContract.parse(entry);

      expect(result).toStrictEqual({
        callerPath: entry.callerPath,
        baseImpl: null,
        onceQueue: [],
        calls: [],
      });
    });

    it('VALID: {with custom callerPath} => parses successfully', () => {
      const entry = MockHandleEntryStub({ callerPath: 'fs-read-file-adapter' as never });

      const result = mockHandleEntryContract.parse(entry);

      expect(result).toStrictEqual({
        callerPath: 'fs-read-file-adapter',
        baseImpl: null,
        onceQueue: [],
        calls: [],
      });
    });
  });

  describe('invalid entries', () => {
    it('INVALID: null => throws validation error', () => {
      expect(() => {
        return mockHandleEntryContract.parse(null);
      }).toThrow(/Expected object/u);
    });

    it('INVALID: undefined => throws validation error', () => {
      expect(() => {
        return mockHandleEntryContract.parse(undefined);
      }).toThrow(/Required/u);
    });
  });
});
