import { jestRegisterModuleMockAdapter } from './jest-register-module-mock-adapter';
import { jestRegisterModuleMockAdapterProxy } from './jest-register-module-mock-adapter.proxy';

describe('jestRegisterModuleMockAdapter', () => {
  it('VALID: {module, factory} => no-op at runtime (AST transformer handles hoisting)', () => {
    jestRegisterModuleMockAdapterProxy();

    jestRegisterModuleMockAdapter({
      module: 'test-module',
      factory: () => ({ value: 'mocked' }),
    });

    expect(true).toBe(true);
  });
});
