/**
 * PURPOSE: Stub factory for SlotIndex branded number type
 *
 * USAGE:
 * const slotIndex = SlotIndexStub({ value: 2 });
 * // Returns branded SlotIndex number
 */
import { slotIndexContract, type SlotIndex } from './slot-index-contract';

export const SlotIndexStub = ({ value }: { value?: number } = {}): SlotIndex =>
  slotIndexContract.parse(value ?? 0);
