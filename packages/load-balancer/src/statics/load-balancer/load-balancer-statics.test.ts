import { loadBalancerStatics } from './load-balancer-statics';

describe('loadBalancerStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(loadBalancerStatics).toStrictEqual({
      packageName: 'load-balancer',
      registry: {
        dirEnvVar: 'DUNGEONMASTER_LOAD_DIR',
        homeRelativeDir: '.dungeonmaster/load',
        fileName: 'registry-v1.db',
        busyTimeoutMs: 5000,
      },
    });
  });
});
