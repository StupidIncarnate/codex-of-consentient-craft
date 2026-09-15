import { laneProcessNameContract } from './lane-process-name-contract';
import type { LaneProcessName } from './lane-process-name-contract';

export const LaneProcessNameStub = (
  { value }: { value: string } = { value: 'api' },
): LaneProcessName => laneProcessNameContract.parse(value);
