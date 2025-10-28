import { spawn } from 'child_process';
import * as path from 'path';
import { JsonRpcResponseStub } from '../contracts/json-rpc-response/json-rpc-response.stub';
import type { JsonRpcRequestStub } from '../contracts/json-rpc-request/json-rpc-request.stub';
import type { RpcIdStub } from '../contracts/rpc-id/rpc-id.stub';
import type { McpServerClientStub } from '../contracts/mcp-server-client/mcp-server-client.stub';
import { mcpServerStatics } from '../statics/mcp-server/mcp-server-statics';

type JsonRpcResponse = ReturnType<typeof JsonRpcResponseStub>;
type JsonRpcRequest = ReturnType<typeof JsonRpcRequestStub>;
type RpcId = ReturnType<typeof RpcIdStub>;
type McpServerClient = ReturnType<typeof McpServerClientStub>;

export const StartMcpServerProxy = (): {
  createClient: () => Promise<McpServerClient>;
} => {
  const createClient = async (): Promise<McpServerClient> => {
    const serverEntryPoint = path.join(__dirname, '../index.ts');

    const serverProcess = spawn('npx', ['tsx', serverEntryPoint], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: path.join(__dirname, '../..'),
    });

    const pendingResponses = new Map<RpcId, (response: JsonRpcResponse) => void>();
    const bufferState = { value: '' };

    serverProcess.stdout.on('data', (chunk: Buffer) => {
      bufferState.value += chunk.toString();

      const lines = bufferState.value.split('\n');
      bufferState.value = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.trim()) {
          continue;
        }

        try {
          const response = JsonRpcResponseStub(JSON.parse(line) as never);
          const resolver = pendingResponses.get(response.id);
          if (resolver) {
            resolver(response);
            pendingResponses.delete(response.id);
          }
        } catch {
          // Ignore parse errors
        }
      }
    });

    await new Promise((resolve) => {
      setTimeout(resolve, mcpServerStatics.timeouts.startupMs);
    });

    return {
      process: serverProcess,
      sendRequest: async (request: JsonRpcRequest): Promise<JsonRpcResponse> =>
        new Promise((resolve, reject) => {
          pendingResponses.set(request.id, resolve);

          const requestJson = `${JSON.stringify(request)}\n`;
          serverProcess.stdin.write(requestJson);

          setTimeout(() => {
            if (pendingResponses.has(request.id)) {
              pendingResponses.delete(request.id);
              reject(new Error(`Request ${request.id} timed out`));
            }
          }, mcpServerStatics.timeouts.requestMs);
        }),
      close: async (): Promise<void> =>
        new Promise((resolve) => {
          serverProcess.on('close', () => {
            resolve();
          });
          serverProcess.kill();
        }),
    };
  };

  return { createClient };
};
