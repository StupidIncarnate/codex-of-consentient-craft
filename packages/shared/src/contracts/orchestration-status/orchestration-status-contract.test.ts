import { orchestrationStatusContract } from './orchestration-status-contract';
import { OrchestrationStatusStub } from './orchestration-status.stub';
import { OrchestrationSlotStub } from '../orchestration-slot/orchestration-slot.stub';

describe('orchestrationStatusContract', () => {
  describe('valid status', () => {
    it('VALID: {minimal status} => parses successfully', () => {
      const result = OrchestrationStatusStub();

      expect(orchestrationStatusContract.parse(result)).toStrictEqual({
        processId: 'proc-12345',
        questId: 'add-auth',
        phase: 'idle',
        completed: 0,
        total: 5,
        slots: [],
      });
    });

    it('VALID: {with currentStep} => parses with optional step', () => {
      const result = OrchestrationStatusStub({ currentStep: 'Create user model' });

      expect(result.currentStep).toBe('Create user model');
    });

    it('VALID: {with slots} => parses with slot array', () => {
      const slot = OrchestrationSlotStub({ slotId: 0, status: 'running', step: 'Step 1' });
      const result = OrchestrationStatusStub({ slots: [slot] });

      expect(result.slots).toStrictEqual([{ slotId: 0, status: 'running', step: 'Step 1' }]);
    });

    it('VALID: {phase: "pathseeker"} => parses pathseeker phase', () => {
      const result = OrchestrationStatusStub({ phase: 'pathseeker' });

      expect(result.phase).toBe('pathseeker');
    });

    it('VALID: {phase: "codeweaver"} => parses codeweaver phase', () => {
      const result = OrchestrationStatusStub({ phase: 'codeweaver' });

      expect(result.phase).toBe('codeweaver');
    });

    it('VALID: {phase: "siegemaster"} => parses siegemaster phase', () => {
      const result = OrchestrationStatusStub({ phase: 'siegemaster' });

      expect(result.phase).toBe('siegemaster');
    });

    it('VALID: {phase: "lawbringer"} => parses lawbringer phase', () => {
      const result = OrchestrationStatusStub({ phase: 'lawbringer' });

      expect(result.phase).toBe('lawbringer');
    });

    it('VALID: {phase: "spiritmender"} => parses spiritmender phase', () => {
      const result = OrchestrationStatusStub({ phase: 'spiritmender' });

      expect(result.phase).toBe('spiritmender');
    });

    it('VALID: {phase: "complete"} => parses complete phase', () => {
      const result = OrchestrationStatusStub({ phase: 'complete' });

      expect(result.phase).toBe('complete');
    });
  });

  describe('invalid status', () => {
    it('INVALID_PHASE: {phase: "unknown"} => throws validation error', () => {
      expect(() => {
        orchestrationStatusContract.parse({
          processId: 'proc-123',
          questId: 'add-auth',
          phase: 'unknown',
          completed: 0,
          total: 5,
          slots: [],
        });
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID_COMPLETED: {completed: -1} => throws validation error', () => {
      expect(() => {
        orchestrationStatusContract.parse({
          processId: 'proc-123',
          questId: 'add-auth',
          phase: 'idle',
          completed: -1,
          total: 5,
          slots: [],
        });
      }).toThrow(/Number must be greater than or equal to 0/u);
    });

    it('INVALID_TOTAL: {total: -1} => throws validation error', () => {
      expect(() => {
        orchestrationStatusContract.parse({
          processId: 'proc-123',
          questId: 'add-auth',
          phase: 'idle',
          completed: 0,
          total: -1,
          slots: [],
        });
      }).toThrow(/Number must be greater than or equal to 0/u);
    });

    it('INVALID_MISSING_PROCESS_ID: {} => throws validation error', () => {
      expect(() => {
        orchestrationStatusContract.parse({
          questId: 'add-auth',
          phase: 'idle',
          completed: 0,
          total: 5,
          slots: [],
        });
      }).toThrow(/Required/u);
    });
  });
});
