import { getEnv } from './get-env';
import { getEnvProxy } from './get-env.proxy';

describe('getEnv', () => {
  it('VALID: {name of a set variable} => returns its string value', () => {
    process.env.DM_NODE_GATEWAY_TEST_VAR = 'a-value';

    const result = getEnv('DM_NODE_GATEWAY_TEST_VAR');

    Reflect.deleteProperty(process.env, 'DM_NODE_GATEWAY_TEST_VAR');

    expect(result).toBe('a-value');
  });

  it('EMPTY: {name of an unset variable} => returns undefined', () => {
    Reflect.deleteProperty(process.env, 'DM_NODE_GATEWAY_TEST_VAR_UNSET');

    const result = getEnv('DM_NODE_GATEWAY_TEST_VAR_UNSET');

    expect(result).toBe(undefined);
  });

  describe('getEnvProxy', () => {
    it('VALID: {setupEnv: NAME_A => value-a} => a read of NAME_A returns the staged value', () => {
      const proxy = getEnvProxy();
      proxy.setupEnv({ name: 'DM_NODE_GATEWAY_STAGED_A', value: 'value-a' });

      expect(getEnv('DM_NODE_GATEWAY_STAGED_A')).toBe('value-a');
    });

    it('VALID: {setupEnv: NAME_A => undefined} => a read of NAME_A returns undefined', () => {
      const proxy = getEnvProxy();
      proxy.setupEnv({ name: 'DM_NODE_GATEWAY_STAGED_UNSET', value: undefined });

      expect(getEnv('DM_NODE_GATEWAY_STAGED_UNSET')).toBe(undefined);
    });

    it('VALID: {two names staged} => each name answers its own value', () => {
      const proxy = getEnvProxy();
      proxy.setupEnv({ name: 'DM_NODE_GATEWAY_STAGED_ONE', value: 'one' });
      proxy.setupEnv({ name: 'DM_NODE_GATEWAY_STAGED_TWO', value: 'two' });

      expect([
        getEnv('DM_NODE_GATEWAY_STAGED_ONE'),
        getEnv('DM_NODE_GATEWAY_STAGED_TWO'),
      ]).toStrictEqual(['one', 'two']);
    });

    it('VALID: {getCallsFor after two reads of NAME_A} => one full argument tuple per read', () => {
      const proxy = getEnvProxy();
      proxy.setupEnv({ name: 'DM_NODE_GATEWAY_STAGED_CALLS', value: 'x' });

      getEnv('DM_NODE_GATEWAY_STAGED_CALLS');
      getEnv('DM_NODE_GATEWAY_STAGED_CALLS');

      expect(proxy.getCallsFor({ name: 'DM_NODE_GATEWAY_STAGED_CALLS' })).toStrictEqual([
        ['DM_NODE_GATEWAY_STAGED_CALLS'],
        ['DM_NODE_GATEWAY_STAGED_CALLS'],
      ]);
    });

    it('EMPTY: {getCallsFor for a name never read} => no calls', () => {
      const proxy = getEnvProxy();
      proxy.setupEnv({ name: 'DM_NODE_GATEWAY_STAGED_IDLE', value: 'x' });

      expect(proxy.getCallsFor({ name: 'DM_NODE_GATEWAY_STAGED_IDLE' })).toStrictEqual([]);
    });
  });
});
