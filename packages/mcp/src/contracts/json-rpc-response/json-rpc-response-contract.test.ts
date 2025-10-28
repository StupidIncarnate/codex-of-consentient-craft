import { JsonRpcResponseStub } from './json-rpc-response.stub';

describe('jsonRpcResponseContract', () => {
  it('VALID: {id: 1, result: {}} => parses successfully', () => {
    const result = JsonRpcResponseStub({ id: 1, result: {} });

    expect(result).toStrictEqual({
      jsonrpc: '2.0',
      id: 1,
      result: {},
    });
  });

  it('VALID: {id: "test-id", result: {tools: []}} => parses successfully', () => {
    const result = JsonRpcResponseStub({
      id: 'test-id',
      result: { tools: [] },
    });

    expect(result).toStrictEqual({
      jsonrpc: '2.0',
      id: 'test-id',
      result: { tools: [] },
    });
  });

  it('VALID: {id: 5, error: {code: -32603, message: "Unknown tool"}} => parses successfully', () => {
    const result = JsonRpcResponseStub({
      id: 5,
      error: { code: -32603, message: 'Unknown tool' },
    });

    expect(result).toStrictEqual({
      jsonrpc: '2.0',
      id: 5,
      error: { code: -32603, message: 'Unknown tool' },
    });
  });
});
