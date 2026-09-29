import type { resolve } from '#gateway/node/path';
import { actualModuleRequireMiddleware } from './actual-module-require-middleware';
import { actualModuleRequireMiddlewareProxy } from './actual-module-require-middleware.proxy';

describe('actualModuleRequireMiddleware', () => {
  it('VALID: {module: "path"} => returns the real path module, whose resolve joins segments', () => {
    actualModuleRequireMiddlewareProxy();

    const realPath = actualModuleRequireMiddleware<{ resolve: typeof resolve }>({ module: 'path' });

    expect(realPath.resolve('/a', 'b')).toBe('/a/b');
  });
});
