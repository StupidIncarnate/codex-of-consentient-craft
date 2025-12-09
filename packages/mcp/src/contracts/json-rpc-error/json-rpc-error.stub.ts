import { jsonRpcErrorContract } from './json-rpc-error-contract';
import type { JsonRpcError } from './json-rpc-error-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const JsonRpcErrorStub = ({ ...props }: StubArgument<JsonRpcError> = {}): JsonRpcError =>
  jsonRpcErrorContract.parse({
    code: -32603,
    message: 'Internal error',
    ...props,
  });
