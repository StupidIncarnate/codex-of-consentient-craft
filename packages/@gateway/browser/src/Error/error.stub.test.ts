import { ErrorStub } from './error.stub';

describe('ErrorStub', () => {
  it('VALID: {} => a real Error with the default message', () => {
    const error = ErrorStub();

    expect({ isError: error instanceof Error, message: error.message }).toStrictEqual({
      isError: true,
      message: 'sample',
    });
  });

  it('VALID: {message} => a real Error carrying the given message', () => {
    const error = ErrorStub({ message: 'boom' });

    expect(error.message).toBe('boom');
  });
});
