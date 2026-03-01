import { spawn } from 'child_process';
import * as path from 'path';
import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';
import { JsonRpcRequestStub } from '../contracts/json-rpc-request/json-rpc-request.stub';
import { JsonRpcResponseStub } from '../contracts/json-rpc-response/json-rpc-response.stub';
import { RpcIdStub } from '../contracts/rpc-id/rpc-id.stub';
import { RpcMethodStub } from '../contracts/rpc-method/rpc-method.stub';
import { ToolListResultStub } from '../contracts/tool-list-result/tool-list-result.stub';
import { mcpServerStatics } from '../statics/mcp-server/mcp-server-statics';
import { BufferStateStub } from '../contracts/buffer-state/buffer-state.stub';

type JsonRpcResponse = ReturnType<typeof JsonRpcResponseStub>;
type JsonRpcRequest = ReturnType<typeof JsonRpcRequestStub>;
type RpcId = ReturnType<typeof RpcIdStub>;

const createMcpClient = async (): Promise<{
  process: ReturnType<typeof spawn>;
  sendRequest: (request: JsonRpcRequest) => Promise<JsonRpcResponse>;
  close: () => Promise<void>;
}> => {
  const serverEntryPoint = path.join(__dirname, '../index.ts');

  const testbed = installTestbedCreateBroker({
    baseName: BaseNameStub({ value: 'startup-mcp-wiring' }),
  });

  const serverProcess = spawn('npx', ['tsx', serverEntryPoint], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: testbed.guildPath,
    env: { ...process.env, DUNGEONMASTER_HOME: testbed.guildPath },
  });

  const pendingResponses = new Map<RpcId, (response: JsonRpcResponse) => void>();
  const pendingTimeouts = new Map<RpcId, NodeJS.Timeout>();
  const bufferState = BufferStateStub();

  const dataHandler = (chunk: Buffer): void => {
    bufferState.value = (bufferState.value + chunk.toString()) as typeof bufferState.value;

    const lines = bufferState.value.split('\n');
    const remaining = lines.pop() ?? '';
    bufferState.value = remaining as typeof bufferState.value;

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) {
        continue;
      }

      try {
        const parsed: unknown = JSON.parse(trimmedLine);
        const response = JsonRpcResponseStub(parsed as never);
        const resolver = pendingResponses.get(response.id);
        if (resolver) {
          const timeoutId = pendingTimeouts.get(response.id);
          if (timeoutId) {
            clearTimeout(timeoutId);
            pendingTimeouts.delete(response.id);
          }

          resolver(response);
          pendingResponses.delete(response.id);
        }
      } catch {
        // Ignore parse errors
      }
    }
  };

  serverProcess.stdout.on('data', dataHandler);

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

        const timeoutId = setTimeout(() => {
          if (pendingResponses.has(request.id)) {
            pendingResponses.delete(request.id);
            pendingTimeouts.delete(request.id);
            reject(new Error(`Request ${request.id} timed out`));
          }
        }, mcpServerStatics.timeouts.requestMs);

        pendingTimeouts.set(request.id, timeoutId);
      }),
    close: async (): Promise<void> =>
      new Promise((resolve) => {
        for (const timeoutId of pendingTimeouts.values()) {
          clearTimeout(timeoutId);
        }
        pendingTimeouts.clear();
        pendingResponses.clear();

        serverProcess.once('close', () => {
          serverProcess.stdout.removeAllListeners();
          serverProcess.stderr.removeAllListeners();
          serverProcess.stdin.removeAllListeners();
          testbed.cleanup();
          resolve();
        });

        serverProcess.stdout.off('data', dataHandler);
        serverProcess.kill();
      }),
  };
};

jest.setTimeout(30_000);

describe('StartMcpServer', () => {
  describe('wiring', () => {
    it('VALID: startup delegates to flows and returns all expected tools', async () => {
      const client = await createMcpClient();

      const initRequest = JsonRpcRequestStub({
        id: RpcIdStub({ value: 1 }),
        method: RpcMethodStub({ value: 'initialize' }),
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'test-client', version: '1.0.0' },
        },
      });

      await client.sendRequest(initRequest);

      const listRequest = JsonRpcRequestStub({
        id: RpcIdStub({ value: 2 }),
        method: RpcMethodStub({ value: 'tools/list' }),
        params: {},
      });

      const response = await client.sendRequest(listRequest);

      await client.close();

      expect(response.error).toBeUndefined();

      const result = ToolListResultStub(response.result as never);

      expect(result.tools.length).toBeGreaterThanOrEqual(17);
    });
  });
});
