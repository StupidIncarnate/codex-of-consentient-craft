import { mtimeMsContract } from './mtime-ms-contract';
import type { MtimeMs } from './mtime-ms-contract';

export const MtimeMsStub = ({ value }: { value?: number } = {}): MtimeMs =>
  mtimeMsContract.parse(value ?? 1708473600000);
