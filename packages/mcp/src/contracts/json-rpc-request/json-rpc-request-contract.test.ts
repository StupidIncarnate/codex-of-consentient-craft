import { JsonRpcRequestStub } from './json-rpc-request.stub';

describe('jsonRpcRequestContract', () => {
  it('VALID: {id: 1, method: "initialize"} => parses successfully', () => {
    const result = JsonRpcRequestStub({ id: 1, method: 'initialize' });

    expect(result).toStrictEqual({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
    });
  });

  it('VALID: {id: "test-id", method: "tools/list", params: {}} => parses successfully', () => {
    const result = JsonRpcRequestStub({
      id: 'test-id',
      method: 'tools/list',
      params: {},
    });

    expect(result).toStrictEqual({
      jsonrpc: '2.0',
      id: 'test-id',
      method: 'tools/list',
      params: {},
    });
  });

  it('VALID: {id: 3, method: "tools/call", params: {name: "discover", arguments: {type: "files"}}} => parses successfully', () => {
    const result = JsonRpcRequestStub({
      id: 3,
      method: 'tools/call',
      params: { name: 'discover', arguments: { type: 'files' } },
    });

    expect(result).toStrictEqual({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: { name: 'discover', arguments: { type: 'files' } },
    });
  });
});
