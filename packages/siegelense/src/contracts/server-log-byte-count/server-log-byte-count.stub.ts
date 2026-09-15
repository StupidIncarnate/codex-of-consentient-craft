import {
  serverLogByteCountContract,
  type ServerLogByteCount,
} from './server-log-byte-count-contract';

export const ServerLogByteCountStub = (
  { value }: { value: number } = { value: 0 },
): ServerLogByteCount => serverLogByteCountContract.parse(value);
