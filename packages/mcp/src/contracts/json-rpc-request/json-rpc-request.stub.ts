import { jsonRpcRequestContract } from './json-rpc-request-contract';
import type { JsonRpcRequest } from './json-rpc-request-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const JsonRpcRequestStub = ({
  ...props
}: StubArgument<JsonRpcRequest> = {}): JsonRpcRequest =>
  jsonRpcRequestContract.parse({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    ...props,
  });
