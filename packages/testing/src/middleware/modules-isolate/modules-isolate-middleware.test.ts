import { modulesIsolateMiddleware } from './modules-isolate-middleware';
import { modulesIsolateMiddlewareProxy } from './modules-isolate-middleware.proxy';
import { FilePathStub } from '../../contracts/file-path/file-path.stub';

describe('modulesIsolateMiddleware', () => {
  it('VALID: {mocks: [{module: "path", factory}], entrypoint: "path"} => doMock registers the factory so importing the entrypoint runs it', async () => {
    modulesIsolateMiddlewareProxy();

    let sawMockedFactory = false;

    await modulesIsolateMiddleware({
      mocks: [
        {
          module: FilePathStub({ value: 'path' }),
          factory: () => {
            sawMockedFactory = true;
            return { resolve: () => 'mocked-resolve-result' };
          },
        },
      ],
      entrypoint: FilePathStub({ value: 'path' }),
    });

    expect(sawMockedFactory).toBe(true);
  });
});
