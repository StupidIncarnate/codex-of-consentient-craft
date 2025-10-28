import { z } from 'zod';
import type { JsonRpcRequest } from '../json-rpc-request/json-rpc-request-contract';
import type { JsonRpcResponse } from '../json-rpc-response/json-rpc-response-contract';

// Contract defines ONLY data properties
// NOTE: process is unknown because contracts cannot import external packages (child_process)
// Full type safety provided by stub which imports ChildProcess
export const mcpServerClientContract = z.object({
  process: z.unknown(),
});

// TypeScript type adds function methods via intersection
// Use ReturnType<typeof McpServerClientStub> for full type including ChildProcess
export type McpServerClient = z.infer<typeof mcpServerClientContract> & {
  sendRequest: (request: JsonRpcRequest) => Promise<JsonRpcResponse>;
  close: () => Promise<void>;
};
