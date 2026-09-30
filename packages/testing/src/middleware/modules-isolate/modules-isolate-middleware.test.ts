import { modulesIsolateMiddleware } from './modules-isolate-middleware';
import { modulesIsolateMiddlewareProxy } from './modules-isolate-middleware.proxy';
import { IsolateModulesMockStub } from '../../contracts/isolate-modules-mock/isolate-modules-mock.stub';

describe('modulesIsolateMiddleware', () => {
  it('VALID: {mocks: [{module: "path", factory}], entrypoint: "path"} => doMock registers the factory so importing the entrypoint runs it', async () => {
    modulesIsolateMiddlewareProxy();

    let sawMockedFactory = false;

    await modulesIsolateMiddleware({
      mocks: [
        IsolateModulesMockStub({
          module: 'path',
          factory: () => {
            sawMockedFactory = true;
            return { resolve: () => 'mocked-resolve-result' };
          },
        }),
      ],
      entrypoint: 'path',
    });

    expect(sawMockedFactory).toBe(true);
  });
});
