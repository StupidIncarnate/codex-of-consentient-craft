import { AgentTypeStub, ExecutionLogEntryStub } from '@dungeonmaster/shared/contracts';

import { executionLogAgentSummaryTransformer } from './execution-log-agent-summary-transformer';

type ExecutionLogEntry = ReturnType<typeof ExecutionLogEntryStub>;

const wardType = AgentTypeStub({ value: 'ward' });
const codeweaverType = AgentTypeStub({ value: 'codeweaver' });
const siegemasterType = AgentTypeStub({ value: 'siegemaster' });

describe('executionLogAgentSummaryTransformer', () => {
  describe('empty log', () => {
    it('EMPTY: {executionLog: []} => returns undefined lastEntry and zero failCount', () => {
      const result = executionLogAgentSummaryTransformer({
        executionLog: [],
        agentType: wardType,
      });

      expect(result).toStrictEqual({
        lastEntry: undefined,
        failCount: 0,
      });
    });
  });

  describe('no resetAfterAgentType (lifetime counting)', () => {
    it('VALID: {two ward fails} => counts both failures', () => {
      const executionLog: ExecutionLogEntry[] = [
        ExecutionLogEntryStub({
          agentType: 'ward',
          outcome: 'fail',
          timestamp: '2024-01-15T10:00:00.000Z',
        }),
        ExecutionLogEntryStub({
          agentType: 'ward',
          outcome: 'fail',
          timestamp: '2024-01-15T11:00:00.000Z',
        }),
      ];

      const result = executionLogAgentSummaryTransformer({
        executionLog,
        agentType: wardType,
      });

      expect(result).toStrictEqual({
        lastEntry: executionLog[1],
        failCount: 2,
      });
    });

    it('VALID: {mixed agent types} => only counts target agent type', () => {
      const executionLog: ExecutionLogEntry[] = [
        ExecutionLogEntryStub({
          agentType: 'codeweaver',
          outcome: 'fail',
          timestamp: '2024-01-15T10:00:00.000Z',
        }),
        ExecutionLogEntryStub({
          agentType: 'ward',
          outcome: 'fail',
          timestamp: '2024-01-15T11:00:00.000Z',
        }),
        ExecutionLogEntryStub({
          agentType: 'siegemaster',
          outcome: 'fail',
          timestamp: '2024-01-15T12:00:00.000Z',
        }),
      ];

      const result = executionLogAgentSummaryTransformer({
        executionLog,
        agentType: wardType,
      });

      expect(result).toStrictEqual({
        lastEntry: executionLog[1],
        failCount: 1,
      });
    });
  });

  describe('resetAfterAgentType (per-cycle counting)', () => {
    it('VALID: {siegemaster fail, codeweaver pass, siegemaster fail} => counts only fail after last codeweaver pass', () => {
      const executionLog: ExecutionLogEntry[] = [
        ExecutionLogEntryStub({
          agentType: 'siegemaster',
          outcome: 'fail',
          timestamp: '2024-01-15T10:00:00.000Z',
        }),
        ExecutionLogEntryStub({
          agentType: 'codeweaver',
          outcome: 'pass',
          timestamp: '2024-01-15T11:00:00.000Z',
        }),
        ExecutionLogEntryStub({
          agentType: 'siegemaster',
          outcome: 'fail',
          timestamp: '2024-01-15T12:00:00.000Z',
        }),
      ];

      const result = executionLogAgentSummaryTransformer({
        executionLog,
        agentType: siegemasterType,
        resetAfterAgentType: codeweaverType,
      });

      expect(result).toStrictEqual({
        lastEntry: executionLog[2],
        failCount: 1,
      });
    });

    it('VALID: {two cycles, both have siegemaster failures} => only counts failures from current cycle', () => {
      const executionLog: ExecutionLogEntry[] = [
        ExecutionLogEntryStub({
          agentType: 'siegemaster',
          outcome: 'fail',
          timestamp: '2024-01-15T09:00:00.000Z',
        }),
        ExecutionLogEntryStub({
          agentType: 'siegemaster',
          outcome: 'fail',
          timestamp: '2024-01-15T09:30:00.000Z',
        }),
        ExecutionLogEntryStub({
          agentType: 'codeweaver',
          outcome: 'pass',
          timestamp: '2024-01-15T10:00:00.000Z',
        }),
        ExecutionLogEntryStub({
          agentType: 'siegemaster',
          outcome: 'fail',
          timestamp: '2024-01-15T11:00:00.000Z',
        }),
      ];

      const result = executionLogAgentSummaryTransformer({
        executionLog,
        agentType: siegemasterType,
        resetAfterAgentType: codeweaverType,
      });

      expect(result).toStrictEqual({
        lastEntry: executionLog[3],
        failCount: 1,
      });
    });

    it('VALID: {no prerequisite pass exists} => counts all failures from start', () => {
      const executionLog: ExecutionLogEntry[] = [
        ExecutionLogEntryStub({
          agentType: 'siegemaster',
          outcome: 'fail',
          timestamp: '2024-01-15T10:00:00.000Z',
        }),
        ExecutionLogEntryStub({
          agentType: 'siegemaster',
          outcome: 'fail',
          timestamp: '2024-01-15T11:00:00.000Z',
        }),
      ];

      const result = executionLogAgentSummaryTransformer({
        executionLog,
        agentType: siegemasterType,
        resetAfterAgentType: codeweaverType,
      });

      expect(result).toStrictEqual({
        lastEntry: executionLog[1],
        failCount: 2,
      });
    });

    it('VALID: {codeweaver fail does not reset} => only codeweaver pass resets the window', () => {
      const executionLog: ExecutionLogEntry[] = [
        ExecutionLogEntryStub({
          agentType: 'siegemaster',
          outcome: 'fail',
          timestamp: '2024-01-15T10:00:00.000Z',
        }),
        ExecutionLogEntryStub({
          agentType: 'codeweaver',
          outcome: 'fail',
          timestamp: '2024-01-15T11:00:00.000Z',
        }),
        ExecutionLogEntryStub({
          agentType: 'siegemaster',
          outcome: 'fail',
          timestamp: '2024-01-15T12:00:00.000Z',
        }),
      ];

      const result = executionLogAgentSummaryTransformer({
        executionLog,
        agentType: siegemasterType,
        resetAfterAgentType: codeweaverType,
      });

      expect(result).toStrictEqual({
        lastEntry: executionLog[2],
        failCount: 2,
      });
    });

    it('VALID: {ward fail after codeweaver pass} => counts ward fails in current cycle', () => {
      const executionLog: ExecutionLogEntry[] = [
        ExecutionLogEntryStub({
          agentType: 'ward',
          outcome: 'fail',
          timestamp: '2024-01-15T09:00:00.000Z',
        }),
        ExecutionLogEntryStub({
          agentType: 'codeweaver',
          outcome: 'pass',
          timestamp: '2024-01-15T10:00:00.000Z',
        }),
        ExecutionLogEntryStub({
          agentType: 'ward',
          outcome: 'fail',
          timestamp: '2024-01-15T11:00:00.000Z',
        }),
        ExecutionLogEntryStub({
          agentType: 'ward',
          outcome: 'fail',
          timestamp: '2024-01-15T12:00:00.000Z',
        }),
      ];

      const result = executionLogAgentSummaryTransformer({
        executionLog,
        agentType: wardType,
        resetAfterAgentType: codeweaverType,
      });

      expect(result).toStrictEqual({
        lastEntry: executionLog[3],
        failCount: 2,
      });
    });

    it('VALID: {multiple codeweaver passes} => uses most recent pass as reset point', () => {
      const executionLog: ExecutionLogEntry[] = [
        ExecutionLogEntryStub({
          agentType: 'siegemaster',
          outcome: 'fail',
          timestamp: '2024-01-15T08:00:00.000Z',
        }),
        ExecutionLogEntryStub({
          agentType: 'codeweaver',
          outcome: 'pass',
          timestamp: '2024-01-15T09:00:00.000Z',
        }),
        ExecutionLogEntryStub({
          agentType: 'siegemaster',
          outcome: 'fail',
          timestamp: '2024-01-15T10:00:00.000Z',
        }),
        ExecutionLogEntryStub({
          agentType: 'codeweaver',
          outcome: 'pass',
          timestamp: '2024-01-15T11:00:00.000Z',
        }),
        ExecutionLogEntryStub({
          agentType: 'siegemaster',
          outcome: 'fail',
          timestamp: '2024-01-15T12:00:00.000Z',
        }),
      ];

      const result = executionLogAgentSummaryTransformer({
        executionLog,
        agentType: siegemasterType,
        resetAfterAgentType: codeweaverType,
      });

      expect(result).toStrictEqual({
        lastEntry: executionLog[4],
        failCount: 1,
      });
    });

    it('VALID: {pass and fail entries in current cycle} => only counts fails', () => {
      const executionLog: ExecutionLogEntry[] = [
        ExecutionLogEntryStub({
          agentType: 'codeweaver',
          outcome: 'pass',
          timestamp: '2024-01-15T10:00:00.000Z',
        }),
        ExecutionLogEntryStub({
          agentType: 'siegemaster',
          outcome: 'pass',
          timestamp: '2024-01-15T11:00:00.000Z',
        }),
        ExecutionLogEntryStub({
          agentType: 'siegemaster',
          outcome: 'fail',
          timestamp: '2024-01-15T12:00:00.000Z',
        }),
      ];

      const result = executionLogAgentSummaryTransformer({
        executionLog,
        agentType: siegemasterType,
        resetAfterAgentType: codeweaverType,
      });

      expect(result).toStrictEqual({
        lastEntry: executionLog[2],
        failCount: 1,
      });
    });

    it('VALID: {no target entries after reset} => returns undefined lastEntry and zero failCount', () => {
      const executionLog: ExecutionLogEntry[] = [
        ExecutionLogEntryStub({
          agentType: 'siegemaster',
          outcome: 'fail',
          timestamp: '2024-01-15T10:00:00.000Z',
        }),
        ExecutionLogEntryStub({
          agentType: 'codeweaver',
          outcome: 'pass',
          timestamp: '2024-01-15T11:00:00.000Z',
        }),
      ];

      const result = executionLogAgentSummaryTransformer({
        executionLog,
        agentType: siegemasterType,
        resetAfterAgentType: codeweaverType,
      });

      expect(result).toStrictEqual({
        lastEntry: undefined,
        failCount: 0,
      });
    });
  });

  describe('entries without outcome', () => {
    it('EDGE: {entries without outcome field} => does not count as fail', () => {
      const executionLog: ExecutionLogEntry[] = [
        ExecutionLogEntryStub({ agentType: 'ward', timestamp: '2024-01-15T10:00:00.000Z' }),
        ExecutionLogEntryStub({
          agentType: 'ward',
          outcome: 'fail',
          timestamp: '2024-01-15T11:00:00.000Z',
        }),
      ];

      const result = executionLogAgentSummaryTransformer({
        executionLog,
        agentType: wardType,
      });

      expect(result).toStrictEqual({
        lastEntry: executionLog[1],
        failCount: 1,
      });
    });
  });
});
