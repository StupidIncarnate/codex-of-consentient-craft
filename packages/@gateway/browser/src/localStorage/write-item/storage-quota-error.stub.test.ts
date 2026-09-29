import { StorageQuotaErrorStub } from './storage-quota-error.stub';

describe('StorageQuotaErrorStub', () => {
  it('VALID: {} => a real Error named QuotaExceededError with the default message', () => {
    const error = StorageQuotaErrorStub();

    expect({
      isError: error instanceof Error,
      name: error.name,
      message: error.message,
    }).toStrictEqual({ isError: true, name: 'QuotaExceededError', message: 'quota exceeded' });
  });

  it('VALID: {message} => a real Error carrying the given message', () => {
    const error = StorageQuotaErrorStub({ message: 'no room left for this key' });

    expect({ name: error.name, message: error.message }).toStrictEqual({
      name: 'QuotaExceededError',
      message: 'no room left for this key',
    });
  });
});
