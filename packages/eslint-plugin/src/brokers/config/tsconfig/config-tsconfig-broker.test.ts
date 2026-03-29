import { configTsconfigBroker } from './config-tsconfig-broker';
import { configTsconfigBrokerProxy } from './config-tsconfig-broker.proxy';

describe('configTsconfigBroker', () => {
  it('VALID: {} => returns TypeScript config with target ES2020', () => {
    configTsconfigBrokerProxy();

    const result = configTsconfigBroker();

    expect(result.target).toBe('ES2020');
  });

  it('VALID: {} => returns TypeScript config with module commonjs', () => {
    configTsconfigBrokerProxy();

    const result = configTsconfigBroker();

    expect(result.module).toBe('commonjs');
  });

  it('VALID: {} => returns TypeScript config with strict enabled', () => {
    configTsconfigBrokerProxy();

    const result = configTsconfigBroker();

    expect(result.strict).toBe(true);
  });

  it('VALID: {} => enables strictNullChecks', () => {
    configTsconfigBrokerProxy();

    const result = configTsconfigBroker();

    expect(result.strictNullChecks).toBe(true);
  });

  it('VALID: {} => enables noImplicitAny', () => {
    configTsconfigBrokerProxy();

    const result = configTsconfigBroker();

    expect(result.noImplicitAny).toBe(true);
  });

  it('VALID: {} => includes ES2020 lib', () => {
    configTsconfigBrokerProxy();

    const result = configTsconfigBroker();

    expect(result.lib).toStrictEqual(['ES2020']);
  });

  it('VALID: {} => enables declaration', () => {
    configTsconfigBrokerProxy();

    const result = configTsconfigBroker();

    expect(result.declaration).toBe(true);
  });

  it('VALID: {} => enables declarationMap', () => {
    configTsconfigBrokerProxy();

    const result = configTsconfigBroker();

    expect(result.declarationMap).toBe(true);
  });
});
