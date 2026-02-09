import { slotStatusContract } from './slot-status-contract';
import { SlotStatusStub } from './slot-status.stub';

describe('slotStatusContract', () => {
  describe('valid statuses', () => {
    it('VALID: {idle} => parses successfully', () => {
      const status = SlotStatusStub({ value: 'idle' });

      const result = slotStatusContract.parse(status);

      expect(result).toBe('idle');
    });

    it('VALID: {running} => parses successfully', () => {
      const status = SlotStatusStub({ value: 'running' });

      const result = slotStatusContract.parse(status);

      expect(result).toBe('running');
    });

    it('VALID: {completed} => parses successfully', () => {
      const status = SlotStatusStub({ value: 'completed' });

      const result = slotStatusContract.parse(status);

      expect(result).toBe('completed');
    });

    it('VALID: {failed} => parses successfully', () => {
      const status = SlotStatusStub({ value: 'failed' });

      const result = slotStatusContract.parse(status);

      expect(result).toBe('failed');
    });
  });

  describe('invalid statuses', () => {
    it('INVALID: {unknown status} => throws validation error', () => {
      expect(() => {
        slotStatusContract.parse('unknown');
      }).toThrow(/Invalid enum value/u);
    });
  });
});
