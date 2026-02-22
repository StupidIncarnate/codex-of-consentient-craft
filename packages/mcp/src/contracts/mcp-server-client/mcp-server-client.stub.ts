import { mcpServerClientContract } from './mcp-server-client-contract';
import type { McpServerClient } from './mcp-server-client-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';
import type { JsonRpcRequest } from '../json-rpc-request/json-rpc-request-contract';
import { JsonRpcResponseStub } from '../json-rpc-response/json-rpc-response.stub';

export const McpServerClientStub = ({
  ...props
}: StubArgument<McpServerClient> = {}): McpServerClient => {
  // Separate function props from data props
  const { sendRequest, close, ...dataProps } = props;

  // Mock process object for testing (plain object, no ChildProcess import needed)
  const mockProcess = {};

  // Return: validated data + functions (preserved references)
  return {
    // Data properties validated through contract
    ...mcpServerClientContract.parse({
      process: mockProcess,
      ...dataProps,
    }),
    // Function properties preserved (not parsed to maintain references)
    sendRequest:
      sendRequest ?? (async (_request: JsonRpcRequest) => Promise.resolve(JsonRpcResponseStub())),
    close: close ?? (async () => Promise.resolve()),
  };
};
