import { workItemEntryContract } from './work-item-entry-contract';
import { WorkItemEntryStub } from './work-item-entry.stub';

describe('workItemEntryContract', () => {
  describe('valid entries', () => {
    it('VALID: {default stub} => parses successfully', () => {
      const entry = WorkItemEntryStub();

      const result = workItemEntryContract.parse(entry);

      expect(result.status).toBe('pending');
      expect(result.retryCount).toBe(0);
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
  });

  describe('invalid entries', () => {
    it('INVALID_STATUS: {status: "unknown"} => throws', () => {
      expect(() =>
        workItemEntryContract.parse({
          ...WorkItemEntryStub(),
          status: 'unknown',
        }),
      ).toThrow(/invalid_enum_value/u);
    });

    it('INVALID_MULTIPLE: {empty object} => throws', () => {
      expect(() => workItemEntryContract.parse({})).toThrow(/Required/u);
    });
  });
});
