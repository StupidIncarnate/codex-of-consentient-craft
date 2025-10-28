import { JsonRpcErrorStub } from './json-rpc-error.stub';

describe('jsonRpcErrorContract', () => {
  it('VALID: {code: -32603, message: "Internal error"} => parses successfully', () => {
    const result = JsonRpcErrorStub({ code: -32603, message: 'Internal error' });

    expect(result).toStrictEqual({
      code: -32603,
      message: 'Internal error',
    });
  });

  it('VALID: {code: -32600, message: "Invalid Request", data: {details: "test"}} => parses successfully', () => {
    const result = JsonRpcErrorStub({
      code: -32600,
      message: 'Invalid Request',
      data: { details: 'test' },
    });

    expect(result).toStrictEqual({
      code: -32600,
      message: 'Invalid Request',
      data: { details: 'test' },
    });
  });

  it('VALID: {code: 0, message: ""} => parses successfully', () => {
    const result = JsonRpcErrorStub({ code: 0, message: '' });

    expect(result).toStrictEqual({
      code: 0,
      message: '',
    });
  });
});
