import { AddressInUseErrorStub } from './address-in-use-error.stub';

describe('AddressInUseErrorStub', () => {
  it('VALID: {} => a real EADDRINUSE error from an actual bind conflict', async () => {
    const error = await AddressInUseErrorStub();

    expect({ code: error.code, syscall: error.syscall }).toStrictEqual({
      code: 'EADDRINUSE',
      syscall: 'listen',
    });
  });
});
