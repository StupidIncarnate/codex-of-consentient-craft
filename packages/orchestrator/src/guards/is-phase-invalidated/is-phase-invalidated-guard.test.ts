import { AgentTypeStub, ExecutionLogEntryStub } from '@dungeonmaster/shared/contracts';

import { isPhaseInvalidatedGuard } from './is-phase-invalidated-guard';

describe('isPhaseInvalidatedGuard', () => {
  describe('valid checks', () => {
    it('VALID: {ward passed, codeweaver ran after} => returns true', () => {
      const executionLog = [
        ExecutionLogEntryStub({
          agentType: 'ward',
          status: 'pass',
          timestamp: '2024-01-15T10:00:00.000Z',
        }),
        ExecutionLogEntryStub({
          agentType: 'codeweaver',
          timestamp: '2024-01-15T11:00:00.000Z',
        }),
      ];

      const result = isPhaseInvalidatedGuard({
        executionLog,
        agentType: AgentTypeStub({ value: 'ward' }),
        prerequisiteType: AgentTypeStub({ value: 'codeweaver' }),
      });

      expect(result).toBe(true);
    });

    it('VALID: {ward passed, no codeweaver after} => returns false', () => {
      const executionLog = [
        ExecutionLogEntryStub({
          agentType: 'codeweaver',
          timestamp: '2024-01-15T09:00:00.000Z',
        }),
        ExecutionLogEntryStub({
          agentType: 'ward',
          status: 'pass',
          timestamp: '2024-01-15T10:00:00.000Z',
        }),
      ];

      const result = isPhaseInvalidatedGuard({
        executionLog,
        agentType: AgentTypeStub({ value: 'ward' }),
        prerequisiteType: AgentTypeStub({ value: 'codeweaver' }),
      });

      expect(result).toBe(false);
    });

    it('VALID: {no ward pass entries} => returns false', () => {
      const executionLog = [
        ExecutionLogEntryStub({
          agentType: 'ward',
          status: 'fail',
          timestamp: '2024-01-15T10:00:00.000Z',
        }),
        ExecutionLogEntryStub({
          agentType: 'codeweaver',
          timestamp: '2024-01-15T11:00:00.000Z',
        }),
      ];

      const result = isPhaseInvalidatedGuard({
        executionLog,
        agentType: AgentTypeStub({ value: 'ward' }),
        prerequisiteType: AgentTypeStub({ value: 'codeweaver' }),
      });

      expect(result).toBe(false);
    });

    it('VALID: {no prerequisite entries} => returns false', () => {
      const executionLog = [
        ExecutionLogEntryStub({
          agentType: 'ward',
          status: 'pass',
          timestamp: '2024-01-15T10:00:00.000Z',
        }),
      ];

      const result = isPhaseInvalidatedGuard({
        executionLog,
        agentType: AgentTypeStub({ value: 'ward' }),
        prerequisiteType: AgentTypeStub({ value: 'codeweaver' }),
      });

      expect(result).toBe(false);
    });
  });

  describe('empty and missing inputs', () => {
    it('EMPTY: {no executionLog} => returns false', () => {
      const result = isPhaseInvalidatedGuard({
        agentType: AgentTypeStub({ value: 'ward' }),
        prerequisiteType: AgentTypeStub({ value: 'codeweaver' }),
      });

      expect(result).toBe(false);
    });

    it('EMPTY: {no agentType} => returns false', () => {
      const result = isPhaseInvalidatedGuard({
        executionLog: [],
        prerequisiteType: AgentTypeStub({ value: 'codeweaver' }),
      });

      expect(result).toBe(false);
    });

    it('EMPTY: {no prerequisiteType} => returns false', () => {
      const result = isPhaseInvalidatedGuard({
        executionLog: [],
        agentType: AgentTypeStub({ value: 'ward' }),
      });

      expect(result).toBe(false);
    });

    it('EMPTY: {empty executionLog} => returns false', () => {
      const result = isPhaseInvalidatedGuard({
        executionLog: [],
        agentType: AgentTypeStub({ value: 'ward' }),
        prerequisiteType: AgentTypeStub({ value: 'codeweaver' }),
      });

      expect(result).toBe(false);
    });
  });
});
