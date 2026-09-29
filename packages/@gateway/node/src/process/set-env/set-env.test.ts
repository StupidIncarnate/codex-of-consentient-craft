import { setEnv } from './set-env';

describe('setEnv', () => {
  it('VALID: {name, value} => process.env holds the value under that name', () => {
    setEnv('DM_NODE_GATEWAY_SET_VAR', 'a-value');

    const result = process.env.DM_NODE_GATEWAY_SET_VAR;
    Reflect.deleteProperty(process.env, 'DM_NODE_GATEWAY_SET_VAR');

    expect(result).toBe('a-value');
  });

  it('VALID: {name already set} => the new value replaces the old one', () => {
    process.env.DM_NODE_GATEWAY_SET_VAR = 'old';

    setEnv('DM_NODE_GATEWAY_SET_VAR', 'new');

    const result = process.env.DM_NODE_GATEWAY_SET_VAR;
    Reflect.deleteProperty(process.env, 'DM_NODE_GATEWAY_SET_VAR');

    expect(result).toBe('new');
  });

  it('EMPTY: {value: empty string} => the variable is set to the empty string, not removed', () => {
    setEnv('DM_NODE_GATEWAY_SET_VAR', '');

    const result = {
      isSet: 'DM_NODE_GATEWAY_SET_VAR' in process.env,
      value: process.env.DM_NODE_GATEWAY_SET_VAR,
    };
    Reflect.deleteProperty(process.env, 'DM_NODE_GATEWAY_SET_VAR');

    expect(result).toStrictEqual({ isSet: true, value: '' });
  });
});
