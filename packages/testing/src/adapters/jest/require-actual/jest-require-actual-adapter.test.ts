import { jestRequireActualAdapter } from './jest-require-actual-adapter';
import { jestRequireActualAdapterProxy } from './jest-require-actual-adapter.proxy';

describe('jestRequireActualAdapter', () => {
  it('VALID: {module: "path"} => returns real path module with resolve function', () => {
    jestRequireActualAdapterProxy();

    const realPath = jestRequireActualAdapter({ module: 'path' });

    expect(typeof Reflect.get(realPath as object, 'resolve')).toBe('function');
  });
});
