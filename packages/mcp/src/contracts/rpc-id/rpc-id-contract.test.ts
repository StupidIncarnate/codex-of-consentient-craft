import { RpcIdStub } from './rpc-id.stub';

describe('rpcIdContract', () => {
  it('VALID: {value: 1} => parses successfully', () => {
    const result = RpcIdStub({ value: 1 });

    expect(result).toBe(1);
  });

  it('VALID: {value: "test-id"} => parses successfully', () => {
    const result = RpcIdStub({ value: 'test-id' });

    expect(result).toBe('test-id');
  });

  it('VALID: {value: 0} => parses successfully', () => {
    const result = RpcIdStub({ value: 0 });

    expect(result).toBe(0);
  });
});
