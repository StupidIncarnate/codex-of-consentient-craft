import { AgentTypeStub, ExecutionLogEntryStub } from '@dungeonmaster/shared/contracts';

import { executionLogAgentSummaryTransformer } from './execution-log-agent-summary-transformer';

describe('executionLogAgentSummaryTransformer', () => {
  describe('valid transformations', () => {
    it('VALID: {entries for agent type} => returns last entry and fail count', () => {
      const wardPass = ExecutionLogEntryStub({
        agentType: AgentTypeStub({ value: 'ward' }),
        status: 'pass',
        timestamp: '2024-01-15T10:00:00.000Z',
      });
      const wardFail = ExecutionLogEntryStub({
        agentType: AgentTypeStub({ value: 'ward' }),
        status: 'fail',
        timestamp: '2024-01-15T11:00:00.000Z',
      });

      const result = executionLogAgentSummaryTransformer({
        executionLog: [wardPass, wardFail],
        agentType: AgentTypeStub({ value: 'ward' }),
      });

      expect(result).toStrictEqual({
        lastEntry: wardFail,
        failCount: 1,
      });
    });

    it('VALID: {mixed agent types} => only counts target agent type', () => {
      const wardEntry = ExecutionLogEntryStub({
        agentType: AgentTypeStub({ value: 'ward' }),
        status: 'fail',
        timestamp: '2024-01-15T10:00:00.000Z',
      });
      const codeweaverEntry = ExecutionLogEntryStub({
        agentType: 'codeweaver',
        status: 'fail',
        timestamp: '2024-01-15T11:00:00.000Z',
      });

      const result = executionLogAgentSummaryTransformer({
        executionLog: [wardEntry, codeweaverEntry],
        agentType: AgentTypeStub({ value: 'ward' }),
      });

      expect(result).toStrictEqual({
        lastEntry: wardEntry,
        failCount: 1,
      });
    });

    it('VALID: {all passes} => fail count is zero', () => {
      const entry = ExecutionLogEntryStub({
        agentType: AgentTypeStub({ value: 'ward' }),
        status: 'pass',
        timestamp: '2024-01-15T10:00:00.000Z',
      });

      const result = executionLogAgentSummaryTransformer({
        executionLog: [entry],
        agentType: AgentTypeStub({ value: 'ward' }),
      });

      expect(result).toStrictEqual({
        lastEntry: entry,
        failCount: 0,
      });
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {empty execution log} => returns undefined last entry and zero fail count', () => {
      const result = executionLogAgentSummaryTransformer({
        executionLog: [],
        agentType: AgentTypeStub({ value: 'ward' }),
      });

      expect(result).toStrictEqual({
        lastEntry: undefined,
        failCount: 0,
      });
    });

    it('EMPTY: {no matching agent type} => returns undefined last entry and zero fail count', () => {
      const entry = ExecutionLogEntryStub({
        agentType: 'codeweaver',
        status: 'fail',
        timestamp: '2024-01-15T10:00:00.000Z',
      });

      const result = executionLogAgentSummaryTransformer({
        executionLog: [entry],
        agentType: AgentTypeStub({ value: 'ward' }),
      });

      expect(result).toStrictEqual({
        lastEntry: undefined,
        failCount: 0,
      });
    });
  });
});
