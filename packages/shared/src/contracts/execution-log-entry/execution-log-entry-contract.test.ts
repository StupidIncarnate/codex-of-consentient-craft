import { executionLogEntryContract } from './execution-log-entry-contract';
import { ExecutionLogEntryStub } from './execution-log-entry.stub';

describe('executionLogEntryContract', () => {
  describe('valid entries', () => {
    it('VALID: minimal entry => parses successfully', () => {
      const entry = ExecutionLogEntryStub();

      const result = executionLogEntryContract.parse(entry);

      expect(result).toStrictEqual({
        report: '001-pathseeker-report.json',
        timestamp: '2024-01-15T10:00:00.000Z',
      });
    });

    it('VALID: entry with all fields => parses successfully', () => {
      const entry = ExecutionLogEntryStub({
        report: '002-codeweaver-report.json',
        stepId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        timestamp: '2024-01-15T12:00:00.000Z',
        agentType: 'codeweaver',
        isRecovery: true,
      });

      const result = executionLogEntryContract.parse(entry);

      expect(result.report).toBe('002-codeweaver-report.json');
      expect(result.stepId).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479');
      expect(result.agentType).toBe('codeweaver');
      expect(result.isRecovery).toBe(true);
    });
  });

  describe('invalid entries', () => {
    it('INVALID: missing report => throws validation error', () => {
      expect(() => {
        executionLogEntryContract.parse({
          timestamp: '2024-01-15T10:00:00.000Z',
        });
      }).toThrow(/Required/u);
    });

    it('INVALID: invalid timestamp => throws validation error', () => {
      expect(() => {
        executionLogEntryContract.parse({
          report: '001-report.json',
          timestamp: 'not-a-timestamp',
        });
      }).toThrow(/Invalid datetime/u);
    });

    it('INVALID: invalid stepId uuid => throws validation error', () => {
      expect(() => {
        executionLogEntryContract.parse({
          report: '001-report.json',
          timestamp: '2024-01-15T10:00:00.000Z',
          stepId: 'not-a-uuid',
        });
      }).toThrow(/Invalid uuid/u);
    });
  });
});
