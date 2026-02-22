import { errorCodeContract } from './error-code-contract';
import type { ErrorCode } from './error-code-contract';

export const ErrorCodeStub = (
  {
    value,
  }: {
    value: number;
  } = {
    value: -32603,
  },
): ErrorCode => errorCodeContract.parse(value);
