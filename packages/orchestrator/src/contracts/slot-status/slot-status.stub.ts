import { slotStatusContract } from './slot-status-contract';
import type { SlotStatus } from './slot-status-contract';

export const SlotStatusStub = ({ value }: { value: SlotStatus } = { value: 'idle' }): SlotStatus =>
  slotStatusContract.parse(value);
