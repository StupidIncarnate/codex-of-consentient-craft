import { jestIsolateModulesAdapter } from './jest-isolate-modules-adapter';
import { jestIsolateModulesAdapterProxy } from './jest-isolate-modules-adapter.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';

describe('jestIsolateModulesAdapter', () => {
  it('VALID: {mocks, entrypoint} => applies doMock and requires entrypoint in isolated scope', () => {
    jestIsolateModulesAdapterProxy();

    let callCount = 0;

    callCount += 1;
    jestIsolateModulesAdapter({
      mocks: [
        {
          module: FilePathStub({ value: 'path' }),
          factory: () => ({ resolve: jest.fn() }),
        },
      ],
      entrypoint: FilePathStub({ value: 'path' }),
    });
    callCount += 1;

    expect(callCount).toBe(2);
  });
});
