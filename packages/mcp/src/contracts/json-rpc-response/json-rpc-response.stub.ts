import { jsonRpcResponseContract } from './json-rpc-response-contract';
import type { JsonRpcResponse } from './json-rpc-response-contract';
import type { StubArgument } from '@questmaestro/shared/@types';

export const JsonRpcResponseStub = ({
  ...props
}: StubArgument<JsonRpcResponse> = {}): JsonRpcResponse =>
  jsonRpcResponseContract.parse({
    jsonrpc: '2.0',
    id: 1,
    ...props,
  });
