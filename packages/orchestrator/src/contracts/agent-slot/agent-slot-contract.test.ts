import { agentSlotContract } from './agent-slot-contract';
import { AgentSlotStub } from './agent-slot.stub';
import { KillableProcessStub } from '../killable-process/killable-process.stub';

describe('agentSlotContract', () => {
  describe('valid inputs', () => {
    it('VALID: {complete agent slot with defaults} => parses successfully', () => {
      const agentSlot = AgentSlotStub();

      const result = agentSlotContract.parse(agentSlot);

      expect(result).toStrictEqual({
        stepId: 'create-login-api',
        sessionId: 'session-test-123',
        process: {
          kill: expect.any(Function),
          waitForExit: expect.any(Function),
        },
        startedAt: '2024-01-15T10:00:00.000Z',
      });
    });

    it('VALID: {custom stepId} => parses with overridden stepId', () => {
      const agentSlot = AgentSlotStub({ stepId: 'setup-database' as never });

      const result = agentSlotContract.parse(agentSlot);

      expect(result).toStrictEqual({
        stepId: 'setup-database',
        sessionId: 'session-test-123',
        process: {
          kill: expect.any(Function),
          waitForExit: expect.any(Function),
        },
        startedAt: '2024-01-15T10:00:00.000Z',
      });
    });

    it('VALID: {custom sessionId} => parses with overridden sessionId', () => {
      const agentSlot = AgentSlotStub({ sessionId: 'custom-session-456' });

      const result = agentSlotContract.parse(agentSlot);

      expect(result).toStrictEqual({
        stepId: 'create-login-api',
        sessionId: 'custom-session-456',
        process: {
          kill: expect.any(Function),
          waitForExit: expect.any(Function),
        },
        startedAt: '2024-01-15T10:00:00.000Z',
      });
    });

    it('VALID: {custom startedAt} => parses with overridden startedAt', () => {
      const agentSlot = AgentSlotStub({ startedAt: '2025-06-20T15:30:00.000Z' });

      const result = agentSlotContract.parse(agentSlot);

      expect(result).toStrictEqual({
        stepId: 'create-login-api',
        sessionId: 'session-test-123',
        process: {
          kill: expect.any(Function),
          waitForExit: expect.any(Function),
        },
        startedAt: '2025-06-20T15:30:00.000Z',
      });
    });

    it('VALID: {custom process} => parses with overridden process', () => {
      const customProcess = KillableProcessStub({ kill: () => false });
      const agentSlot = AgentSlotStub({ process: customProcess });

      const result = agentSlotContract.parse(agentSlot);

      expect(result).toStrictEqual({
        stepId: 'create-login-api',
        sessionId: 'session-test-123',
        process: {
          kill: expect.any(Function),
          waitForExit: expect.any(Function),
        },
        startedAt: '2024-01-15T10:00:00.000Z',
      });
      expect(result.process.kill()).toBe(false);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_STEP_ID: {uppercase string} => throws validation error', () => {
      expect(() => AgentSlotStub({ stepId: 'INVALID_STEP' as never })).toThrow(/invalid_string/u);
    });

    it('INVALID_STEP_ID: {empty string} => throws validation error', () => {
      expect(() => AgentSlotStub({ stepId: '' as never })).toThrow(/too_small/u);
    });

    it('INVALID_SESSION_ID: {non-string value} => throws validation error', () => {
      expect(() => AgentSlotStub({ sessionId: 123 as never })).toThrow(/Expected string/u);
    });

    it('INVALID_STEP_ID: {non-string value} => throws validation error', () => {
      expect(() => AgentSlotStub({ stepId: 123 as never })).toThrow(/Expected string/u);
    });

    it('INVALID_STARTED_AT: {non-string value} => throws validation error', () => {
      expect(() => AgentSlotStub({ startedAt: 123 as never })).toThrow(/Expected string/u);
    });

    it('INVALID_STARTED_AT: {non-datetime string} => throws validation error', () => {
      expect(() => AgentSlotStub({ startedAt: 'not-a-date' as never })).toThrow(
        /Invalid datetime/u,
      );
    });

    it('INVALID_STARTED_AT: {invalid date format} => throws validation error', () => {
      expect(() => AgentSlotStub({ startedAt: '2024-13-45T99:99:99.000Z' as never })).toThrow(
        /Invalid datetime/u,
      );
    });

    it('INVALID_PROCESS: {null value} => throws validation error', () => {
      expect(() => AgentSlotStub({ process: null as never })).toThrow(/Expected object/u);
    });

    it('INVALID_PROCESS: {non-object value} => throws validation error', () => {
      expect(() => AgentSlotStub({ process: 'not-a-process' as never })).toThrow(
        /Expected object/u,
      );
    });

    it('INVALID_PROCESS: {missing kill method} => throws validation error', () => {
      expect(() =>
        agentSlotContract.parse({
          stepId: 'create-login-api',
          sessionId: 'test-session',
          process: { waitForExit: async () => Promise.resolve() },
          startedAt: '2024-01-15T10:00:00.000Z',
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID_PROCESS: {missing waitForExit method} => throws validation error', () => {
      expect(() =>
        agentSlotContract.parse({
          stepId: 'create-login-api',
          sessionId: 'test-session',
          process: { kill: () => true },
          startedAt: '2024-01-15T10:00:00.000Z',
        }),
      ).toThrow(/Required/u);
    });
  });
});
