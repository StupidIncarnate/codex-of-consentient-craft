import { agentSlotContract } from './agent-slot-contract';
import { AgentSlotStub } from './agent-slot.stub';
import { KillableProcessStub } from '../killable-process/killable-process.stub';

describe('agentSlotContract', () => {
  describe('valid inputs', () => {
    it('VALID: {complete agent slot with defaults} => parses successfully', () => {
      const agentSlot = AgentSlotStub();

      const result = agentSlotContract.parse(agentSlot);

      expect(result).toStrictEqual({
        stepId: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
        sessionId: 'session-test-123',
        process: {
          kill: expect.any(Function),
          waitForExit: expect.any(Function),
        },
        startedAt: '2024-01-15T10:00:00.000Z',
      });
    });

    it('VALID: {custom stepId} => parses with overridden stepId', () => {
      const agentSlot = AgentSlotStub({ stepId: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });

      const result = agentSlotContract.parse(agentSlot);

      expect(result).toStrictEqual({
        stepId: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
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
        stepId: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
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
        stepId: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
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
        stepId: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
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
    it('INVALID_STEP_ID: {non-uuid string} => throws validation error', () => {
      expect(() => AgentSlotStub({ stepId: 'not-a-uuid' as never })).toThrow(/Invalid uuid/u);
    });

    it('INVALID_STEP_ID: {empty string} => throws validation error', () => {
      expect(() => AgentSlotStub({ stepId: '' as never })).toThrow(/Invalid uuid/u);
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
          stepId: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
          sessionId: 'test-session',
          process: { waitForExit: async () => Promise.resolve() },
          startedAt: '2024-01-15T10:00:00.000Z',
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID_PROCESS: {missing waitForExit method} => throws validation error', () => {
      expect(() =>
        agentSlotContract.parse({
          stepId: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
          sessionId: 'test-session',
          process: { kill: () => true },
          startedAt: '2024-01-15T10:00:00.000Z',
        }),
      ).toThrow(/Required/u);
    });
  });
});
