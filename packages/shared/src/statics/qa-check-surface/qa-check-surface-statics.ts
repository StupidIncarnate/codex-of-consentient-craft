/**
 * PURPOSE: Maps every observable outcome type to the surface its value must actually be read from,
 * so the QA checklist tool can state the check surface deterministically instead of leaving each
 * walker to re-derive it (and get `custom` wrong)
 *
 * USAGE:
 * qaCheckSurfaceStatics.byOutcomeType['db-query'];
 * // Returns the sentence describing where a db-query observable is confirmed
 *
 * The surface a flow is DRIVEN at and the surface an observable is CHECKED at are routinely
 * different — a browser flow can carry a `db-query` or `log-output` observable, and the DOM cannot
 * show a row that was written or a line that was logged. `custom` is the one every session gets
 * wrong: it is a behavioural invariant, not an I/O channel, so its entry says so in full.
 *
 * Keys must stay 1:1 with `outcomeTypeContract` — the colocated test asserts that against the
 * contract's own options, so adding an outcome type without a surface fails the build.
 */

export const qaCheckSurfaceStatics = {
  byOutcomeType: {
    'api-call':
      'the real HTTP exchange — the method and URL sent, and the real status code and response body read back',
    'file-exists': 'the real filesystem — the path on disk, and the actual contents of the file',
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
      'a BEHAVIOURAL INVARIANT, not an I/O channel — drive the real path that should produce it, inspect the actual result or state it left behind, and reason about whether the invariant held. NEVER reduce it to "a request fired". A grep or static assertion is the correct check ONLY when the observable itself names one (for example "grep for X returns zero matches"), and then the grep output IS the measured value',
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
} as const;
