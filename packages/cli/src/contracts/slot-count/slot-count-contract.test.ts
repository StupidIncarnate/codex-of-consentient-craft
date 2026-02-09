import { slotCountContract } from './slot-count-contract';
import { SlotCountStub } from './slot-count.stub';

type SlotCount = ReturnType<typeof SlotCountStub>;

describe('slotCountContract', () => {
  it('VALID: non-negative integer => parses successfully', () => {
    const result: SlotCount = SlotCountStub({ value: 3 });

    expect(slotCountContract.parse(result)).toBe(3);
  });
});
