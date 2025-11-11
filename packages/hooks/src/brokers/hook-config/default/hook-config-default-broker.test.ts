import { hookConfigDefaultBroker } from './hook-config-default-broker';
import { hookConfigDefaultBrokerProxy } from './hook-config-default-broker.proxy';

describe('hookConfigDefaultBroker', () => {
  it('VALID: {} => returns PreEditLintConfig with pre-edit rules from plugin', () => {
    hookConfigDefaultBrokerProxy();

    const result = hookConfigDefaultBroker();

    expect(Array.isArray(result.rules)).toBe(true);
    expect(result.rules.length).toBeGreaterThan(30);
  });
});
