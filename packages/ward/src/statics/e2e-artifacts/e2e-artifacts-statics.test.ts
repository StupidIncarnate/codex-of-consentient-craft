import { e2eArtifactsStatics } from './e2e-artifacts-statics';
import { ttlStatics } from '../ttl/ttl-statics';

describe('e2eArtifactsStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(e2eArtifactsStatics).toStrictEqual({
      artifacts: [
        { parentDir: 'node_modules', prefix: '.vite-', suffix: '', ttlMs: 172_800_000 },
        { parentDir: 'test-results', prefix: '', suffix: '', ttlMs: 604_800_000 },
        {
          parentDir: '.',
          prefix: '.ward-playwright-report-',
          suffix: '.json',
          ttlMs: 604_800_000,
        },
      ],
    });
  });

  // The evidence window is a MIRROR of ttlStatics.runResultTtl, copied because statics cannot
  // import statics. Pin the two together so a change to the ward-result window is not silently
  // left behind here, where the same reasoning applies to Playwright traces.
  it('VALID: evidence-bearing artifacts => share the ward run-result TTL', () => {
    const evidenceTtls = e2eArtifactsStatics.artifacts
      .filter((artifact) => artifact.parentDir !== 'node_modules')
      .map((artifact) => artifact.ttlMs);

    expect(evidenceTtls).toStrictEqual([ttlStatics.runResultTtl, ttlStatics.runResultTtl]);
  });

  // The cache is spillage, not evidence, so it must expire sooner than the traces do. A change
  // that made them equal would quietly restore the 900 MB.
  it('VALID: the vite cache window => is shorter than the evidence window', () => {
    const [cache] = e2eArtifactsStatics.artifacts;

    expect(cache.ttlMs).toBeLessThan(ttlStatics.runResultTtl);
  });
});
