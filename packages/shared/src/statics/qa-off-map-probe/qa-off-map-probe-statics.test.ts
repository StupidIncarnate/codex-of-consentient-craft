import { qaOffMapProbeStatics } from './qa-off-map-probe-statics';

describe('qaOffMapProbeStatics', () => {
  describe('probes name a concrete action, not a category', () => {
    it('VALID: {concurrency} => names double-submit, two clients, and parallel requests', () => {
      expect(qaOffMapProbeStatics.byFamily.concurrency).toBe(
        'The same action twice (double-submit), two tabs or two clients, parallel requests against one resource. Does it serialise, or race?',
      );
    });

    it('VALID: {interruption} => names the damage classes a clean-looking error can still leave behind', () => {
      expect(qaOffMapProbeStatics.byFamily.interruption).toBe(
        'Kill the process mid-action, drop the network mid-request, cancel halfway. Partial files? Half-written state? Orphaned records? A stuck spinner?',
      );
    });

    it('VALID: {perf} => names elapsed time, the per-action request count, and a realistic data volume', () => {
      expect(qaOffMapProbeStatics.byFamily.perf).toBe(
        'Time the slowest realistic path end to end, count the requests or queries ONE user action fires, and drive it at a realistic data volume rather than a one-row fixture. Does the work per action climb with the number of rows on screen?',
      );
    });
  });

  describe('full exported value', () => {
    // Pins all seven keys 1:1 with qaOffMapFamilyContract's options. A statics file (and its test)
    // cannot import a contract, so this literal IS the coverage assertion.
    it('VALID: {statics} => matches the complete probe map', () => {
      expect(qaOffMapProbeStatics).toStrictEqual({
        byFamily: {
          're-entry':
            'Refresh mid-flow, go back and forward, deep-link straight into a mid-flow URL, leave and return, repeat the same action. Does state survive or corrupt?',
          concurrency:
            'The same action twice (double-submit), two tabs or two clients, parallel requests against one resource. Does it serialise, or race?',
          interruption:
            'Kill the process mid-action, drop the network mid-request, cancel halfway. Partial files? Half-written state? Orphaned records? A stuck spinner?',
          staleness:
            'Let a cache, session, token, or connection go stale, then act. Trigger the path fast, then slow.',
          configuration:
            'Break the config, point at the wrong port, remove a dependency. Does the failure mode match what the flow claims, or does it fail silently?',
          'hostile-input':
            'Empty, whitespace-only, oversized, malformed, duplicate, and injection-shaped input (path traversal, script- or SQL-shaped payloads wherever the flow carries untrusted input toward a dangerous sink). Does it reject safely?',
          perf: 'Time the slowest realistic path end to end, count the requests or queries ONE user action fires, and drive it at a realistic data volume rather than a one-row fixture. Does the work per action climb with the number of rows on screen?',
        },
      });
    });
  });
});
