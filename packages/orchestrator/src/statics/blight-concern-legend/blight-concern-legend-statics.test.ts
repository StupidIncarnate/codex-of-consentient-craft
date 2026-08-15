import { blightConcernLegendStatics } from './blight-concern-legend-statics';

describe('blightConcernLegendStatics', () => {
  describe('full exported value', () => {
    // Pins all five keys 1:1 with blightConcernContract's options. A statics file (and its test)
    // cannot import a contract, so this literal IS the coverage assertion: adding a concern
    // without a legend entry here fails this test rather than rendering a blank legend line.
    it('VALID: {statics} => matches the complete concern legend', () => {
      expect(blightConcernLegendStatics).toStrictEqual({
        byConcern: {
          craft:
            'logic-vs-signature correctness, a PURPOSE header that is true of the body beneath it (lint checks the header exists, never that it is accurate), and error handling that propagates useful context',
          perf: 'quadratic loops, N+1, sync I/O in async, unbounded work, plus simplification — work the code performs that it need not perform at all',
          dedup: 'semantic duplication, within-diff and against existing repo code',
          integrity:
            'code that typechecks but MEANS something different to its consumers, plus stubs, fixtures, or `.default(...)` papering over a break',
          'test-cases':
            'every branch this commit added has a test case at all — the narrower question a diff answers on its own, not whether a spec observable is proven, which is the Flowrider track',
        },
      });
    });
  });
});
