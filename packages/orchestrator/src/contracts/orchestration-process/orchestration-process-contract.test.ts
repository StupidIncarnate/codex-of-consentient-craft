import { orchestrationProcessContract } from './orchestration-process-contract';
import { OrchestrationProcessStub } from './orchestration-process.stub';

describe('orchestrationProcessContract', () => {
  describe('valid orchestration process', () => {
    it('VALID: {default stub} => parses successfully', () => {
      const process = OrchestrationProcessStub();

      const result = orchestrationProcessContract.parse(process);

      expect(result).toStrictEqual({
        processId: 'proc-12345',
        questId: 'add-auth',
        process: {
          kill: expect.any(Function),
          waitForExit: expect.any(Function),
        },
        phase: 'idle',
        completedSteps: 0,
        totalSteps: 5,
        startedAt: '2024-01-15T10:00:00.000Z',
        slots: [],
      });
    });

    it('VALID: {with current step} => parses successfully', () => {
      const process = OrchestrationProcessStub({ currentStep: 'implement-auth' });

      const result = orchestrationProcessContract.parse(process);

      expect(result.currentStep).toBe('implement-auth');
    });

    it('VALID: {with slots} => parses successfully', () => {
      const process = OrchestrationProcessStub({
        slots: [{ slotIndex: 0, status: 'running', stepName: 'auth-guard' }],
      });

      const result = orchestrationProcessContract.parse(process);

      expect(result.slots).toStrictEqual([
        { slotIndex: 0, status: 'running', stepName: 'auth-guard' },
      ]);
    });
  });

  describe('invalid orchestration process', () => {
    it('INVALID: {missing processId} => throws validation error', () => {
      expect(() => {
        orchestrationProcessContract.parse({
          questId: 'add-auth',
          process: { kill: () => true, waitForExit: async () => Promise.resolve() },
          phase: 'idle',
          completedSteps: 0,
          totalSteps: 5,
          startedAt: '2024-01-15T10:00:00.000Z',
          slots: [],
        });
      }).toThrow(/Required/u);
    });

    it('INVALID: {invalid phase} => throws validation error', () => {
      expect(() => {
        orchestrationProcessContract.parse({
          processId: 'proc-123',
          questId: 'add-auth',
          process: { kill: () => true, waitForExit: async () => Promise.resolve() },
          phase: 'invalid-phase',
          completedSteps: 0,
          totalSteps: 5,
          startedAt: '2024-01-15T10:00:00.000Z',
          slots: [],
        });
      }).toThrow(/Invalid enum value/u);
    });
  });
});
