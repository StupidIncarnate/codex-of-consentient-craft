import { gapFloorSecondsContract, type GapFloorSeconds } from './gap-floor-seconds-contract';

export const GapFloorSecondsStub = (
  { value }: { value: string | number } = { value: 30 },
): GapFloorSeconds => gapFloorSecondsContract.parse(value);
