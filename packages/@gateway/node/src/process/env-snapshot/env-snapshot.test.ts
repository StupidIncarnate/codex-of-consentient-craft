import { envSnapshot } from './env-snapshot';
import { envSnapshotProxy } from './env-snapshot.proxy';

describe('envSnapshot', () => {
  it('VALID: {a variable set before the call} => the snapshot carries its value', () => {
    process.env.DM_NODE_GATEWAY_SNAPSHOT_VAR = 'a-value';

    const result = envSnapshot().DM_NODE_GATEWAY_SNAPSHOT_VAR;

    Reflect.deleteProperty(process.env, 'DM_NODE_GATEWAY_SNAPSHOT_VAR');

    expect(result).toBe('a-value');
  });

  it('VALID: {snapshot changed afterwards} => the live environment keeps its own value', () => {
    process.env.DM_NODE_GATEWAY_SNAPSHOT_VAR = 'live';
    const snapshot = envSnapshot();

    snapshot.DM_NODE_GATEWAY_SNAPSHOT_VAR = 'changed';
    const live = process.env.DM_NODE_GATEWAY_SNAPSHOT_VAR;
    Reflect.deleteProperty(process.env, 'DM_NODE_GATEWAY_SNAPSHOT_VAR');

    expect({ live, snapshot: snapshot.DM_NODE_GATEWAY_SNAPSHOT_VAR }).toStrictEqual({
      live: 'live',
      snapshot: 'changed',
    });
  });

  it('VALID: {live variable changed after the snapshot} => the snapshot keeps the earlier value', () => {
    process.env.DM_NODE_GATEWAY_SNAPSHOT_VAR = 'before';
    const snapshot = envSnapshot();

    process.env.DM_NODE_GATEWAY_SNAPSHOT_VAR = 'after';
    Reflect.deleteProperty(process.env, 'DM_NODE_GATEWAY_SNAPSHOT_VAR');

    expect(snapshot.DM_NODE_GATEWAY_SNAPSHOT_VAR).toBe('before');
  });

  it('VALID: {environment staged through the proxy} => the snapshot is exactly that environment', () => {
    const proxy = envSnapshotProxy();
    proxy.returns({ env: { ALPHA: '1', BETA: '2' } });

    const result = envSnapshot();
    proxy.restore();

    expect(result).toStrictEqual({ ALPHA: '1', BETA: '2' });
  });

  describe('restore', () => {
    it('VALID: {restore called after a staged environment} => puts the original process.env property back', () => {
      const originalDescriptor = Object.getOwnPropertyDescriptor(process, 'env');
      const proxy = envSnapshotProxy();
      proxy.returns({ env: { ALPHA: '1' } });

      proxy.restore();

      expect(Object.getOwnPropertyDescriptor(process, 'env')).toStrictEqual(originalDescriptor);
    });
  });
});
