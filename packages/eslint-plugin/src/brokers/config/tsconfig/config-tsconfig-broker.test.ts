import { configTsconfigBroker } from './config-tsconfig-broker';
import { configTsconfigBrokerProxy } from './config-tsconfig-broker.proxy';

describe('configTsconfigBroker', () => {
  it('VALID: {} => returns TypeScript config object', () => {
    configTsconfigBrokerProxy();

    const result = configTsconfigBroker();

    expect(result).toBeDefined();
    expect(result.target).toBe('ES2020');
    expect(result.module).toBe('commonjs');
    expect(result.strict).toBe(true);
  });

  it('VALID: {} => enables strict null checks', () => {
    configTsconfigBrokerProxy();

    const result = configTsconfigBroker();

    expect(result.strictNullChecks).toBe(true);
    expect(result.noImplicitAny).toBe(true);
  });

  it('VALID: {} => includes ES2020 lib', () => {
    configTsconfigBrokerProxy();

    const result = configTsconfigBroker();

    expect(result.lib).toStrictEqual(['ES2020']);
  });

  it('VALID: {} => enables declaration files', () => {
    configTsconfigBrokerProxy();

    const result = configTsconfigBroker();

    expect(result.declaration).toBe(true);
    expect(result.declarationMap).toBe(true);
  });
});
