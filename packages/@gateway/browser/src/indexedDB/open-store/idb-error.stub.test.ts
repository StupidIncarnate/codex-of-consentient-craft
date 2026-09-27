import { IdbErrorStub } from './idb-error.stub';

describe('IdbErrorStub', () => {
  it('VALID: {} => a real DOMException defaulting to UnknownError', () => {
    const error = IdbErrorStub();

    expect({
      isDomException: error instanceof DOMException,
      name: error.name,
      message: error.message,
    }).toStrictEqual({
      isDomException: true,
      name: 'UnknownError',
      message: 'IndexedDB request failed',
    });
  });

  it('VALID: {name, message} => a real DOMException carrying the given name and message', () => {
    const error = IdbErrorStub({ name: 'VersionError', message: 'requested version is lower' });

    expect({ name: error.name, message: error.message }).toStrictEqual({
      name: 'VersionError',
      message: 'requested version is lower',
    });
  });
});
