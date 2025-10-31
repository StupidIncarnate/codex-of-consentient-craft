import { McpServerClientStub } from './mcp-server-client.stub';
import { JsonRpcRequestStub } from '../json-rpc-request/json-rpc-request.stub';
import { JsonRpcResponseStub } from '../json-rpc-response/json-rpc-response.stub';

type JsonRpcResponse = ReturnType<typeof JsonRpcResponseStub>;

describe('mcpServerClientContract', () => {
  it('VALID: {} => creates client with default sendRequest behavior', async () => {
    const result = McpServerClientStub();
    const request = JsonRpcRequestStub();
    const response = await result.sendRequest(request);

    expect(response).toStrictEqual(JsonRpcResponseStub());
  });

  it('VALID: {} => creates client with default close behavior that resolves', async () => {
    const result = McpServerClientStub();

    await expect(result.close()).resolves.toBeUndefined();
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

  it('VALID: {sendRequest: custom, close: custom} => uses both provided functions', async () => {
    const mockSendRequest = jest.fn<Promise<JsonRpcResponse>, [unknown]>();
    const mockClose = jest.fn<Promise<void>, []>();
    const customResponse = JsonRpcResponseStub({ id: 99 });

    mockSendRequest.mockResolvedValue(customResponse);

    const result = McpServerClientStub({
      sendRequest: mockSendRequest,
      close: mockClose,
    });

    const request = JsonRpcRequestStub();
    const response = await result.sendRequest(request);

    expect(response).toStrictEqual(customResponse);
    expect(mockSendRequest).toHaveBeenCalledTimes(1);
    expect(mockSendRequest).toHaveBeenCalledWith(request);

    await result.close();

    expect(mockClose).toHaveBeenCalledTimes(1);
  });
});
