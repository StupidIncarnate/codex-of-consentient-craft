/**
 * PURPOSE: Stub factory for SlotCount branded number type
 *
 * USAGE:
 * const count = SlotCountStub({ value: 5 });
 * // Returns branded SlotCount number
 */
import { slotCountContract, type SlotCount } from './slot-count-contract';

export const SlotCountStub = ({ value }: { value?: number } = {}): SlotCount =>
  slotCountContract.parse(value ?? 3);
