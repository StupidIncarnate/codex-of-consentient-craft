import { durationMsContract, type DurationMs } from './duration-ms-contract';

export const DurationMsStub = ({ value }: { value: number } = { value: 100 }): DurationMs =>
  durationMsContract.parse(value);
