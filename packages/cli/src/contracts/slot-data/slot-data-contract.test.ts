import { slotDataContract } from './slot-data-contract';
import { SlotDataStub } from './slot-data.stub';

type SlotData = ReturnType<typeof SlotDataStub>;

describe('slotDataContract', () => {
  it('VALID: slot data object => parses successfully', () => {
    const result: SlotData = SlotDataStub();

    expect(slotDataContract.parse(result)).toStrictEqual(result);
  });
});
