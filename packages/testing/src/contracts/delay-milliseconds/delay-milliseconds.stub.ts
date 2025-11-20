import { delayMillisecondsContract, type DelayMilliseconds } from './delay-milliseconds-contract';

export const DelayMillisecondsStub = (
  { value }: { value: number } = { value: 0 },
): DelayMilliseconds => delayMillisecondsContract.parse(value);
