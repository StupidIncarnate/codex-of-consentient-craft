import { StorageDisabledErrorStub } from './storage-disabled-error.stub';

describe('StorageDisabledErrorStub', () => {
  it('VALID: {} => a real Error named SecurityError with the default message', () => {
    const error = StorageDisabledErrorStub();

    expect({
      isError: error instanceof Error,
      name: error.name,
      message: error.message,
    }).toStrictEqual({ isError: true, name: 'SecurityError', message: 'access denied' });
  });

  it('VALID: {message} => a real Error carrying the given message', () => {
    const error = StorageDisabledErrorStub({ message: 'storage quota exceeded' });

    expect({ name: error.name, message: error.message }).toStrictEqual({
      name: 'SecurityError',
      message: 'storage quota exceeded',
    });
  });
});
