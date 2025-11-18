import { rpcMethodContract as _rpcMethodContract } from './rpc-method-contract';
import { RpcMethodStub } from './rpc-method.stub';

describe('rpcMethodContract', () => {
  it('VALID: {value: "initialize"} => parses successfully', () => {
    const result = RpcMethodStub({ value: 'initialize' });

    expect(result).toBe('initialize');
  });

  it('VALID: {value: "tools/list"} => parses successfully', () => {
    const result = RpcMethodStub({ value: 'tools/list' });

    expect(result).toBe('tools/list');
  });

  it('VALID: {value: "tools/call"} => parses successfully', () => {
    const result = RpcMethodStub({ value: 'tools/call' });

    expect(result).toBe('tools/call');
  });

  it('VALID: {value: ""} => parses successfully', () => {
    const result = RpcMethodStub({ value: '' });

    expect(result).toBe('');
  });
});
