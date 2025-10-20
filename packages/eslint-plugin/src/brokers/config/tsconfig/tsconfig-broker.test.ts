import { tsconfigBroker } from './tsconfig-broker';
import { tsconfigBrokerProxy } from './tsconfig-broker.proxy';

describe('tsconfigBroker', () => {
  it('VALID: {} => returns TypeScript config object', () => {
    tsconfigBrokerProxy();

    const result = tsconfigBroker();

    expect(result).toBeDefined();
    expect(result.target).toBe('ES2020');
    expect(result.module).toBe('commonjs');
    expect(result.strict).toBe(true);
  });

  it('VALID: {} => enables strict null checks', () => {
    tsconfigBrokerProxy();

    const result = tsconfigBroker();

    expect(result.strictNullChecks).toBe(true);
    expect(result.noImplicitAny).toBe(true);
  });

  it('VALID: {} => includes ES2020 lib', () => {
    tsconfigBrokerProxy();

    const result = tsconfigBroker();

    expect(result.lib).toStrictEqual(['ES2020']);
  });

  it('VALID: {} => enables declaration files', () => {
    tsconfigBrokerProxy();

    const result = tsconfigBroker();

    expect(result.declaration).toBe(true);
    expect(result.declarationMap).toBe(true);
  });
});
