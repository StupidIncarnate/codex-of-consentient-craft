import { ExecutionLogEntryStub } from '@dungeonmaster/shared/contracts';

import { executionLogAgentSummaryContract } from './execution-log-agent-summary-contract';
import { ExecutionLogAgentSummaryStub } from './execution-log-agent-summary.stub';

describe('executionLogAgentSummaryContract', () => {
  describe('valid summaries', () => {
    it('VALID: minimal summary => parses successfully', () => {
      const result = ExecutionLogAgentSummaryStub();

      expect(result).toStrictEqual({
        failCount: 0,
      });
    });

    it('VALID: summary with lastEntry => parses successfully', () => {
      const entry = ExecutionLogEntryStub({
        agentType: 'ward',
        status: 'pass',
        timestamp: '2024-01-15T10:00:00.000Z',
      });
      const result = ExecutionLogAgentSummaryStub({ lastEntry: entry, failCount: 1 });

      expect(result).toStrictEqual({
        lastEntry: entry,
        failCount: 1,
      });
    });
  });

  describe('invalid summaries', () => {
    it('INVALID: missing failCount => throws validation error', () => {
      expect(() => {
        executionLogAgentSummaryContract.parse({});
      }).toThrow(/Required/u);
    });

    it('INVALID: negative failCount => throws validation error', () => {
      expect(() => {
        executionLogAgentSummaryContract.parse({ failCount: -1 });
      }).toThrow(/Number must be greater than or equal to 0/u);
    });
  });
});
