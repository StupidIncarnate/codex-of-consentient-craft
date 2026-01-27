import { slotIndexContract } from './slot-index-contract';
import type { SlotIndex } from './slot-index-contract';

export const SlotIndexStub = ({ value }: { value?: number } = {}): SlotIndex =>
  slotIndexContract.parse(value ?? 0);
