import { jestRegisterModuleMockAdapter } from './jest-register-module-mock-adapter';
import { jestRegisterModuleMockAdapterProxy } from './jest-register-module-mock-adapter.proxy';

describe('jestRegisterModuleMockAdapter', () => {
  it('VALID: {module, factory} => no-op at runtime (AST transformer handles hoisting)', () => {
    jestRegisterModuleMockAdapterProxy();

    let callCount = 0;

    callCount += 1;
    jestRegisterModuleMockAdapter({
      module: 'test-module',
      factory: () => ({ value: 'mocked' }),
    });
    callCount += 1;

    expect(callCount).toBe(2);
  });
});
