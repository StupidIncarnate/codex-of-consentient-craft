import { workItemEntryContract } from './work-item-entry-contract';
import { WorkItemEntryStub } from './work-item-entry.stub';

describe('workItemEntryContract', () => {
  describe('valid entries', () => {
    it('VALID: {default stub} => parses successfully', () => {
      const entry = WorkItemEntryStub();

      const result = workItemEntryContract.parse(entry);

      expect(result).toStrictEqual({
        workUnit: expect.any(Object),
        status: 'pending',
        retryCount: 0,
      });
    });

    it('VALID: {status: completed} => parses successfully', () => {
      const entry = WorkItemEntryStub({ status: 'completed' });

      const result = workItemEntryContract.parse(entry);

      expect(result.status).toBe('completed');
    });

    it('VALID: {status: failed} => parses successfully', () => {
      const entry = WorkItemEntryStub({ status: 'failed' });

      const result = workItemEntryContract.parse(entry);

      expect(result.status).toBe('failed');
    });

    it('VALID: {status: started} => parses successfully', () => {
      const entry = WorkItemEntryStub({ status: 'started' });

      const result = workItemEntryContract.parse(entry);

      expect(result.status).toBe('started');
    });
  });

  describe('invalid entries', () => {
    it('INVALID: {status: "unknown"} => throws', () => {
      expect(() =>
        workItemEntryContract.parse({
          ...WorkItemEntryStub(),
          status: 'unknown',
        }),
      ).toThrow(/invalid_enum_value/u);
    });

    it('INVALID: {status: "partially-completed"} => throws (removed status)', () => {
      expect(() =>
        workItemEntryContract.parse({
          ...WorkItemEntryStub(),
          status: 'partially-completed',
        }),
      ).toThrow(/invalid_enum_value/u);
    });

    it('INVALID: {status: "blocked"} => throws (removed status)', () => {
      expect(() =>
        workItemEntryContract.parse({
          ...WorkItemEntryStub(),
          status: 'blocked',
        }),
      ).toThrow(/invalid_enum_value/u);
    });

    it('INVALID: {empty object} => throws', () => {
      expect(() => workItemEntryContract.parse({})).toThrow(/Required/u);
    });
  });
});
