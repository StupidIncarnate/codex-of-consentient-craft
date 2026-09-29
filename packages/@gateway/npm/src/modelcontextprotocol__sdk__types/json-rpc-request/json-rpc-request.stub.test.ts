import { JsonRpcRequestStub } from './json-rpc-request.stub';

describe('JsonRpcRequestStub', () => {
  it('VALID: {} => a real tools/list request with id 1', () => {
    expect(JsonRpcRequestStub()).toStrictEqual({ jsonrpc: '2.0', id: 1, method: 'tools/list' });
  });

  it('VALID: {id, method, params} => reflects the given request', () => {
    expect(
      JsonRpcRequestStub({ id: 'a', method: 'tools/call', params: { name: 't' } }),
    ).toStrictEqual({
      jsonrpc: '2.0',
      id: 'a',
      method: 'tools/call',
      params: { name: 't' },
    });
  });
});
