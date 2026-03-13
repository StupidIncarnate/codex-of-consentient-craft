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
        failedObservableIds: [],
      });
    });

    it('VALID: entry with all fields => parses successfully', () => {
      const entry = ExecutionLogEntryStub({
        report: '002-codeweaver-report.json',
        stepId: 'create-login-api',
        timestamp: '2024-01-15T12:00:00.000Z',
        agentType: 'codeweaver',
        isRecovery: true,
        status: 'pass',
        failedObservableIds: ['login-redirects-to-dashboard'],
      });

      const result = executionLogEntryContract.parse(entry);

      expect(result).toStrictEqual({
        report: '002-codeweaver-report.json',
        stepId: 'create-login-api',
        timestamp: '2024-01-15T12:00:00.000Z',
        agentType: 'codeweaver',
        isRecovery: true,
        status: 'pass',
        failedObservableIds: ['login-redirects-to-dashboard'],
      });
    });

    it('VALID: entry with status fail => parses successfully', () => {
      const entry = ExecutionLogEntryStub({
        status: 'fail',
        agentType: 'siegemaster',
        failedObservableIds: ['login-redirects-to-dashboard', 'shows-error-on-invalid-creds'],
      });

      const result = executionLogEntryContract.parse(entry);

      expect(result.status).toBe('fail');
      expect(result.failedObservableIds).toStrictEqual([
        'login-redirects-to-dashboard',
        'shows-error-on-invalid-creds',
      ]);
    });

    it('VALID: entry without status => backward compat defaults failedObservableIds to empty', () => {
      const result = executionLogEntryContract.parse({
        report: '001-report.json',
        timestamp: '2024-01-15T10:00:00.000Z',
      });

      expect(result.status).toBeUndefined();
      expect(result.failedObservableIds).toStrictEqual([]);
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

    it('INVALID: invalid stepId format => throws validation error', () => {
      expect(() => {
        executionLogEntryContract.parse({
          report: '001-report.json',
          timestamp: '2024-01-15T10:00:00.000Z',
          stepId: 'INVALID_STEP',
        });
      }).toThrow(/invalid_string/u);
    });
  });
});
