import { workItemIndexRowContract } from './work-item-index-row-contract';
import { WorkItemIndexRowStub } from './work-item-index-row.stub';

describe('workItemIndexRowContract', () => {
  describe('valid rows', () => {
    it('VALID: {minimal fields} => defaults flowIds/packageNames to [], sizes/counts to 0', () => {
      const row = WorkItemIndexRowStub();

      const result = workItemIndexRowContract.parse(row);

      expect(result).toStrictEqual({
        workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        role: 'codeweaver',
        status: 'complete',
        flowIds: [],
        packageNames: [],
        transcriptSizeBytes: 0,
        subagentCount: 0,
      });
    });

    it('VALID: {every field set} => parses the whole joined shape', () => {
      const row = WorkItemIndexRowStub({
        sessionId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        wallClockSeconds: 300,
        operationText: 'core: notification adapter',
        flowIds: ['notify-flow'],
        packageNames: ['core'],
        transcriptSizeBytes: 1_024,
        subagentCount: 2,
        wardRiftcarverSummary: 'ward exit 0 (full)',
      });

      const result = workItemIndexRowContract.parse(row);

      expect(result).toStrictEqual({
        workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        role: 'codeweaver',
        status: 'complete',
        sessionId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        wallClockSeconds: 300,
        operationText: 'core: notification adapter',
        flowIds: ['notify-flow'],
        packageNames: ['core'],
        transcriptSizeBytes: 1_024,
        subagentCount: 2,
        wardRiftcarverSummary: 'ward exit 0 (full)',
      });
    });
  });

  describe('invalid rows', () => {
    it('INVALID: {role: "not-a-role"} => throws', () => {
      expect(() => {
        WorkItemIndexRowStub({ role: 'not-a-role' as never });
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {status: "not-a-status"} => throws', () => {
      expect(() => {
        WorkItemIndexRowStub({ status: 'not-a-status' as never });
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {transcriptSizeBytes: -1} => throws for a negative size', () => {
      expect(() => {
        WorkItemIndexRowStub({ transcriptSizeBytes: -1 });
      }).toThrow(/Number must be greater than or equal to 0/u);
    });
  });
});
