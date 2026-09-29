import { JsonRpcResponseStub } from './json-rpc-response.stub';

describe('JsonRpcResponseStub', () => {
  it('VALID: {} => a real empty-result response with id 1', () => {
    expect(JsonRpcResponseStub()).toStrictEqual({ jsonrpc: '2.0', id: 1, result: {} });
  });

  it('VALID: {id, result} => reflects the given response', () => {
    expect(JsonRpcResponseStub({ id: 'a', result: { tools: [] } })).toStrictEqual({
      jsonrpc: '2.0',
      id: 'a',
      result: { tools: [] },
    });
  });
});
