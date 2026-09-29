import { moduleMockRegisterMiddleware } from './module-mock-register-middleware';
import { moduleMockRegisterMiddlewareProxy } from './module-mock-register-middleware.proxy';

describe('moduleMockRegisterMiddleware', () => {
  it('VALID: {module, factory} => never runs the factory (the hoisted jest.mock runs it)', () => {
    moduleMockRegisterMiddlewareProxy();
    const factoryCalls: unknown[] = [];

    moduleMockRegisterMiddleware({
      module: 'test-module',
      factory: () => {
        factoryCalls.push('ran');
        return { value: 'mocked' };
      },
    });

    expect(factoryCalls).toStrictEqual([]);
  });
});
