import { deleteEnv } from './delete-env';

describe('deleteEnv', () => {
  it('VALID: {name of a set variable} => the key is gone from process.env', () => {
    process.env.DM_NODE_GATEWAY_DELETE_VAR = 'a-value';

    deleteEnv('DM_NODE_GATEWAY_DELETE_VAR');

    expect('DM_NODE_GATEWAY_DELETE_VAR' in process.env).toBe(false);
  });

  it('EMPTY: {name of an unset variable} => no-op, the key stays absent', () => {
    Reflect.deleteProperty(process.env, 'DM_NODE_GATEWAY_DELETE_VAR_UNSET');

    deleteEnv('DM_NODE_GATEWAY_DELETE_VAR_UNSET');

    expect('DM_NODE_GATEWAY_DELETE_VAR_UNSET' in process.env).toBe(false);
  });

  it('EDGE: {name set to the empty string} => the key is removed, not left empty', () => {
    process.env.DM_NODE_GATEWAY_DELETE_VAR = '';

    deleteEnv('DM_NODE_GATEWAY_DELETE_VAR');

    expect('DM_NODE_GATEWAY_DELETE_VAR' in process.env).toBe(false);
  });
});
