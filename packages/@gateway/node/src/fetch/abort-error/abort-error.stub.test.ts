import { AbortErrorStub } from './abort-error.stub';

describe('AbortErrorStub', () => {
  it('VALID: {} => the real AbortError an aborted signal carries', () => {
    const error = AbortErrorStub();

    expect({ name: error.name, message: error.message }).toStrictEqual({
      name: 'AbortError',
      message: 'This operation was aborted',
    });
  });
});
