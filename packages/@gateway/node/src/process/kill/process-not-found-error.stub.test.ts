import { ProcessNotFoundErrorStub } from './process-not-found-error.stub';

describe('ProcessNotFoundErrorStub', () => {
  it('VALID: {} => a real ESRCH error from signaling a pid that no longer exists', async () => {
    const error = await ProcessNotFoundErrorStub();

    expect({ code: error.code, syscall: error.syscall }).toStrictEqual({
      code: 'ESRCH',
      syscall: 'kill',
    });
  });
});
