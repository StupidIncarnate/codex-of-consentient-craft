import { orchestrationSlotContract } from './orchestration-slot-contract';
import { OrchestrationSlotStub } from './orchestration-slot.stub';

describe('orchestrationSlotContract', () => {
  describe('valid slots', () => {
    it('VALID: {slotId: 0, status: "idle"} => parses successfully', () => {
      const result = OrchestrationSlotStub({ slotId: 0, status: 'idle' });

      expect(orchestrationSlotContract.parse(result)).toStrictEqual({
        slotId: 0,
        status: 'idle',
      });
    });

    it('VALID: {slotId: 1, status: "running", step: "Create model"} => parses with step', () => {
      const result = OrchestrationSlotStub({
        slotId: 1,
        status: 'running',
        step: 'Create model',
      });

      expect(orchestrationSlotContract.parse(result)).toStrictEqual({
        slotId: 1,
        status: 'running',
        step: 'Create model',
      });
    });

    it('VALID: {status: "completed"} => parses completed status', () => {
      const result = OrchestrationSlotStub({ status: 'completed' });

      expect(result.status).toBe('completed');
    });

    it('VALID: {status: "failed"} => parses failed status', () => {
      const result = OrchestrationSlotStub({ status: 'failed' });

      expect(result.status).toBe('failed');
    });
  });

  describe('invalid slots', () => {
    it('INVALID_SLOT_ID: {slotId: -1} => throws validation error', () => {
      expect(() => {
        orchestrationSlotContract.parse({ slotId: -1, status: 'idle' });
      }).toThrow(/Number must be greater than or equal to 0/u);
    });

    it('INVALID_STATUS: {status: "unknown"} => throws validation error', () => {
      expect(() => {
        orchestrationSlotContract.parse({ slotId: 0, status: 'unknown' });
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID_MISSING_STATUS: {slotId: 0} => throws validation error', () => {
      expect(() => {
        orchestrationSlotContract.parse({ slotId: 0 });
      }).toThrow(/Required/u);
    });
  });
});
