import { slotIndexContract } from './slot-index-contract';
import { SlotIndexStub } from './slot-index.stub';

describe('slotIndexContract', () => {
  it('VALID: non-negative integer => parses successfully', () => {
    const result = SlotIndexStub({ value: 0 });

    expect(slotIndexContract.parse(result)).toBe(0);
  });
});
