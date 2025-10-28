import { McpServerClientStub } from './mcp-server-client.stub';
import { JsonRpcRequestStub } from '../json-rpc-request/json-rpc-request.stub';

describe('mcpServerClientContract', () => {
  it('VALID: {} => creates client with process and methods', () => {
    const result = McpServerClientStub();

    expect(result.process).toBeDefined();
    expect(typeof result.sendRequest).toBe('function');
    expect(typeof result.close).toBe('function');
  });

  it('VALID: {sendRequest: custom function} => uses provided function', async () => {
    const mockSendRequest = jest.fn();
    const result = McpServerClientStub({ sendRequest: mockSendRequest });

    const request = JsonRpcRequestStub();
    await result.sendRequest(request);

    expect(mockSendRequest).toHaveBeenCalledTimes(1);
    expect(mockSendRequest).toHaveBeenCalledWith(request);
  });

  it('VALID: {close: custom function} => uses provided function', async () => {
    const mockClose = jest.fn();
    const result = McpServerClientStub({ close: mockClose });

    await result.close();

    expect(mockClose).toHaveBeenCalledTimes(1);
  });
});
