import { jestRequireActualAdapter } from './jest-require-actual-adapter';
import { jestRequireActualAdapterProxy } from './jest-require-actual-adapter.proxy';

describe('jestRequireActualAdapter', () => {
  it('VALID: {module: "path"} => returns real path module with resolve function', () => {
    jestRequireActualAdapterProxy();

    const realPath = jestRequireActualAdapter<{ resolve: unknown }>({ module: 'path' });

    expect(realPath.resolve).toStrictEqual(expect.any(Function));
  });
});
