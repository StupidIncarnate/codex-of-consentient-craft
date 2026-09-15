import { epochMsContract, type EpochMs } from './epoch-ms-contract';

export const EpochMsStub = ({ value }: { value: number } = { value: 1_700_000_000_000 }): EpochMs =>
  epochMsContract.parse(value);
