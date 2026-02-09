import { slotManagerResultContract } from './slot-manager-result-contract';
import { SlotManagerResultStub } from './slot-manager-result.stub';

type SlotManagerResult = ReturnType<typeof SlotManagerResultStub>;

describe('slotManagerResultContract', () => {
  it('VALID: completed result => parses successfully', () => {
    const result: SlotManagerResult = SlotManagerResultStub();

    expect(slotManagerResultContract.parse(result)).toStrictEqual(result);
  });
});
