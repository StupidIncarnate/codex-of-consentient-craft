import { blightConcernLegendStatics } from './blight-concern-legend-statics';

describe('blightConcernLegendStatics', () => {
  describe('full exported value', () => {
    // Pins all seven keys 1:1 with blightConcernContract's options. A statics file (and its test)
    // cannot import a contract, so this literal IS the coverage assertion: adding a concern
    // without a legend entry here fails this test rather than rendering a blank legend line.
    it('VALID: {statics} => matches the complete concern legend', () => {
      expect(blightConcernLegendStatics).toStrictEqual({
        byConcern: {
          coverage:
            'every branch in the impl has a real test (if/else, switch, ternary, `?.`, `??`, try/catch, conditional JSX, event handlers), plus `it.each` collapse of copy-paste state matrices',
          craft:
            'logic-vs-signature correctness, error handling that propagates useful context, simplification',
          security: 'untrusted source reaching a dangerous sink without a validating contract',
          dedup: 'semantic duplication, within-diff and against existing repo code',
          perf: 'quadratic loops, N+1, sync I/O in async, unbounded work',
          integrity:
            'consumers of changed exports still work (signature/semantic change, removal, rename)',
          'dead-code': 'orphan exports and unreachable branches',
        },
      });
    });
  });

  describe('individual entries', () => {
    it('VALID: {security} => states the untrusted-source-to-sink ask', () => {
      expect(blightConcernLegendStatics.byConcern.security).toBe(
        'untrusted source reaching a dangerous sink without a validating contract',
      );
    });

    it('VALID: {dead-code} => states the orphan-export-and-unreachable-branch ask', () => {
      expect(blightConcernLegendStatics.byConcern['dead-code']).toBe(
        'orphan exports and unreachable branches',
      );
    });
  });
});
