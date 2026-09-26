import { getEnv } from './get-env';

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
});
