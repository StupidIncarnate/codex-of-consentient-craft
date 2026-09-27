import { ConnectionRefusedErrorStub } from './connection-refused-error.stub';

describe('ConnectionRefusedErrorStub', () => {
  it('VALID: {} => a real ECONNREFUSED error from an actual refused connection', async () => {
    const error = await ConnectionRefusedErrorStub();

    expect({ code: error.code, syscall: error.syscall }).toStrictEqual({
      code: 'ECONNREFUSED',
      syscall: 'connect',
    });
  });
});
