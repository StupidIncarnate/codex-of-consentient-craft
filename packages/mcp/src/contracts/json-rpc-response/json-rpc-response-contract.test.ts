import { jsonRpcResponseContract as _jsonRpcResponseContract } from './json-rpc-response-contract';
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

  it('VALID: {id: "string-id", error: {code: -32600, message: "Invalid request"}} => parses successfully with string id and error', () => {
    const result = JsonRpcResponseStub({
      id: 'string-id',
      error: { code: -32600, message: 'Invalid request' },
    });

    expect(result).toStrictEqual({
      jsonrpc: '2.0',
      id: 'string-id',
      error: { code: -32600, message: 'Invalid request' },
    });
  });

  it('VALID: {id: 1} => parses successfully without result or error', () => {
    const {
      result: _result,
      error: _error,
      ...responseWithoutOptionals
    } = JsonRpcResponseStub({ id: 1 });

    expect(responseWithoutOptionals).toStrictEqual({
      jsonrpc: '2.0',
      id: 1,
    });
  });

  it('VALID: {id: 1, error: {code: -32700, message: "Parse error", data: {detail: "extra"}}} => parses successfully with error data', () => {
    const result = JsonRpcResponseStub({
      id: 1,
      error: { code: -32700, message: 'Parse error', data: { detail: 'extra' } },
    });

    expect(result).toStrictEqual({
      jsonrpc: '2.0',
      id: 1,
      error: { code: -32700, message: 'Parse error', data: { detail: 'extra' } },
    });
  });

  it('VALID: {id: 10, result: null} => parses successfully with null result', () => {
    const result = JsonRpcResponseStub({
      id: 10,
      result: null,
    });

    expect(result).toStrictEqual({
      jsonrpc: '2.0',
      id: 10,
      result: null,
    });
  });
});
