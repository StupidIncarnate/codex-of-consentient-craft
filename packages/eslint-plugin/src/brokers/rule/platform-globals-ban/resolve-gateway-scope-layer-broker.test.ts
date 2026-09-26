import { resolveGatewayScopeLayerBroker } from './resolve-gateway-scope-layer-broker';
import { resolveGatewayScopeLayerBrokerProxy } from './resolve-gateway-scope-layer-broker.proxy';

// resolveGatewayScopeLayerBroker caches its answer at module scope for the whole lint run (one repo
// has one scope), so these cases run in an order that exercises the uncached path exactly once,
// before anything can populate the cache, and the cached-reuse path last.
describe('resolveGatewayScopeLayerBroker', () => {
  it('EMPTY: {no ancestor holds .dungeonmaster.json} => returns undefined', () => {
    resolveGatewayScopeLayerBrokerProxy();

    const result = resolveGatewayScopeLayerBroker({ filename: '/orphan/src/y.ts' });

    expect(result).toBe(undefined);
  });

  it('VALID: {unscoped root package name "dungeonmaster"} => returns "@dungeonmaster"', () => {
    const proxy = resolveGatewayScopeLayerBrokerProxy();
    proxy.setupRepoRoot({
      repoRoot: '/repo',
      rootPackageJson: { name: 'dungeonmaster' },
    });

    const result = resolveGatewayScopeLayerBroker({
      filename: '/repo/packages/node/src/fs/index.ts',
    });

    expect(result).toBe('@dungeonmaster');
  });

  it('VALID: {second call, different filename} => returns the cached scope without re-reading', () => {
    resolveGatewayScopeLayerBrokerProxy();

    const result = resolveGatewayScopeLayerBroker({
      filename: '/repo/packages/browser/src/fetch/index.ts',
    });

    expect(result).toBe('@dungeonmaster');
  });
});
