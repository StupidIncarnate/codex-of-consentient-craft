import { qaCheckSurfaceStatics } from './qa-check-surface-statics';

describe('qaCheckSurfaceStatics', () => {
  describe('the semantics that sessions get wrong', () => {
    it('VALID: {custom} => states it is a behavioural invariant, names the "a request fired" reduction, and sanctions a grep only when the observable names one', () => {
      expect(qaCheckSurfaceStatics.byOutcomeType.custom).toBe(
        'a BEHAVIOURAL INVARIANT, not an I/O channel — drive the real path that should produce it, inspect the actual result or state it left behind, and reason about whether the invariant held. NEVER reduce it to "a request fired". A content search or static assertion is the correct check ONLY when the observable itself names one (for example "no file still references X"), and then the real output of that search IS the measured value — run it with discover({ grep, strict: true }), since a bare shell grep/rg/find is blocked outright in this repo',
      );
    });

    it('VALID: {ui-state} => requires a real attached VISIBLE tab, because a hidden tab reads zero-ish boxes', () => {
      expect(qaCheckSurfaceStatics.byOutcomeType['ui-state']).toBe(
        'the rendered DOM in a real, attached, VISIBLE browser tab',
      );
    });
  });

  describe('full exported value', () => {
    // Pins all twelve keys 1:1 with outcomeTypeContract's options. A statics file (and its test)
    // cannot import a contract, so this literal IS the coverage assertion: adding an outcome type
    // without a surface here fails this test, and qaChecklistBuildTransformer surfaces an
    // unmapped type loudly rather than emitting a blank check surface.
    it('VALID: {statics} => matches the complete surface map', () => {
      expect(qaCheckSurfaceStatics).toStrictEqual({
        byOutcomeType: {
          'api-call':
            'the real HTTP exchange — the method and URL sent, and the real status code and response body read back',
          'file-exists':
            'the real filesystem — the path on disk, and the actual contents of the file',
          environment:
            'the real environment the running process loaded — the variable or config value it actually resolved',
          'log-output': 'the real log stream or log file the running process writes',
          'process-state':
            'the real OS process — that it is running or absent, its argv, or its exit code',
          performance:
            'a real measured figure from the running system — an elapsed duration or a resource count, not an estimate',
          'ui-state': 'the rendered DOM in a real, attached, VISIBLE browser tab',
          'cache-state':
            'the real client-side store — localStorage, sessionStorage, cookies, or the cache layer, read directly',
          'db-query': 'the real datastore — query it and read the actual row or its absence',
          'queue-message': 'the real queue — the enqueued message, and the sink that drains it',
          'external-api':
            'the real outbound call to the third-party service, or the recorded outbound request when the service cannot be called',
          custom:
            'a BEHAVIOURAL INVARIANT, not an I/O channel — drive the real path that should produce it, inspect the actual result or state it left behind, and reason about whether the invariant held. NEVER reduce it to "a request fired". A content search or static assertion is the correct check ONLY when the observable itself names one (for example "no file still references X"), and then the real output of that search IS the measured value — run it with discover({ grep, strict: true }), since a bare shell grep/rg/find is blocked outright in this repo',
        },
        byKind: {
          terminal:
            'the running system at this end state — the values the flow says this terminal has, AND its side-effect surface: no orphaned row, no half-written file, the transaction rolled back, the message not silently consumed, no stuck spinner. A clean-looking error that corrupted state is still a defect',
          branch:
            'the running system after FORCING this branch for real — submit the bad value, trigger the rejection, hit the empty state, exhaust the limit. Never record a branch you happened to land on instead of one you drove',
          observable: 'the surface named by this observable type',
          'off-map':
            'whatever surface the probe touches — record what you actually DID and what you OBSERVED, or an explicit justified "N/A for this flow because …". A silent skip is a rejection',
        },
      });
    });
  });

  describe('non-observable kinds carry their own surface', () => {
    it('VALID: {terminal} => demands the side-effect surface, not just the visible end state', () => {
      expect(qaCheckSurfaceStatics.byKind.terminal).toBe(
        'the running system at this end state — the values the flow says this terminal has, AND its side-effect surface: no orphaned row, no half-written file, the transaction rolled back, the message not silently consumed, no stuck spinner. A clean-looking error that corrupted state is still a defect',
      );
    });

    it('VALID: {branch} => demands the branch be FORCED rather than landed on', () => {
      expect(qaCheckSurfaceStatics.byKind.branch).toBe(
        'the running system after FORCING this branch for real — submit the bad value, trigger the rejection, hit the empty state, exhaust the limit. Never record a branch you happened to land on instead of one you drove',
      );
    });
  });
});
