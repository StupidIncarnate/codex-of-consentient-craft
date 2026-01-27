import { slotCountContract } from './slot-count-contract';
import type { SlotCount } from './slot-count-contract';

export const SlotCountStub = ({ value }: { value?: number } = {}): SlotCount =>
  slotCountContract.parse(value ?? 3);
