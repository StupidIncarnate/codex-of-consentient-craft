import { HostNotFoundErrorStub } from './host-not-found-error.stub';

describe('HostNotFoundErrorStub', () => {
  it('VALID: {} => a real Error shaped like ENOTFOUND for the default hostname', () => {
    const error = HostNotFoundErrorStub();

    expect({ code: error.code, hostname: error.hostname, syscall: error.syscall }).toStrictEqual({
      code: 'ENOTFOUND',
      hostname: 'does-not-exist.invalid',
      syscall: 'getaddrinfo',
    });
  });

  it('VALID: {hostname} => a real Error shaped like ENOTFOUND for that hostname', () => {
    const error = HostNotFoundErrorStub({ hostname: 'example.invalid' });

    expect({ code: error.code, hostname: error.hostname, syscall: error.syscall }).toStrictEqual({
      code: 'ENOTFOUND',
      hostname: 'example.invalid',
      syscall: 'getaddrinfo',
    });
  });
});
