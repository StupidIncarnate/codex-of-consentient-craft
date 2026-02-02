import { orchestrationSlotDataContract } from './orchestration-slot-data-contract';
import { OrchestrationSlotDataStub } from './orchestration-slot-data.stub';

describe('orchestrationSlotDataContract', () => {
  describe('valid slot data', () => {
    it('VALID: {minimal required fields} => parses successfully', () => {
      const slotData = OrchestrationSlotDataStub();

      const result = orchestrationSlotDataContract.parse(slotData);

      expect(result).toStrictEqual({
        slotIndex: 0,
        status: 'idle',
      });
    });

    it('VALID: {with stepName} => parses successfully', () => {
      const slotData = OrchestrationSlotDataStub({ stepName: 'auth-guard' });

      const result = orchestrationSlotDataContract.parse(slotData);

      expect(result).toStrictEqual({
        slotIndex: 0,
        stepName: 'auth-guard',
        status: 'idle',
      });
    });

    it('VALID: {with role} => parses successfully', () => {
      const slotData = OrchestrationSlotDataStub({ role: 'codeweaver' });

      const result = orchestrationSlotDataContract.parse(slotData);

      expect(result).toStrictEqual({
        slotIndex: 0,
        role: 'codeweaver',
        status: 'idle',
      });
    });

    it('VALID: {all fields} => parses successfully', () => {
      const slotData = OrchestrationSlotDataStub({
        slotIndex: 1,
        stepName: 'create-model',
        role: 'pathseeker',
        status: 'running',
      });

      const result = orchestrationSlotDataContract.parse(slotData);

      expect(result).toStrictEqual({
        slotIndex: 1,
        stepName: 'create-model',
        role: 'pathseeker',
        status: 'running',
      });
    });
  });

  describe('invalid slot data', () => {
    it('INVALID: {missing status} => throws validation error', () => {
      expect(() => {
        orchestrationSlotDataContract.parse({ slotIndex: 0 });
      }).toThrow(/Required/u);
    });

    it('INVALID: {invalid slotIndex} => throws validation error', () => {
      expect(() => {
        orchestrationSlotDataContract.parse({ slotIndex: -1, status: 'idle' });
      }).toThrow(/too_small/u);
    });
  });
});
