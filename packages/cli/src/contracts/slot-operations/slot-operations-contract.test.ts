import { slotOperationsContract } from './slot-operations-contract';
import { SlotOperationsStub } from './slot-operations.stub';

type SlotOperations = ReturnType<typeof SlotOperationsStub>;

describe('slotOperationsContract', () => {
  it('VALID: slot operations object => parses successfully', () => {
    const result: SlotOperations = SlotOperationsStub();
    const parsed = slotOperationsContract.parse(result);

    expect(typeof parsed.getAvailableSlot).toBe('function');
    expect(typeof parsed.assignSlot).toBe('function');
    expect(typeof parsed.releaseSlot).toBe('function');
    expect(typeof parsed.getActiveSlots).toBe('function');
  });
});
