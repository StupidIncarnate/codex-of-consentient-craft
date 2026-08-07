/**
 * PURPOSE: The concrete probe each off-map family means, so the QA checklist tool hands a walker
 * the actual thing to try instead of a category name it has to invent an interpretation for
 *
 * USAGE:
 * qaOffMapProbeStatics.byFamily.concurrency;
 * // Returns the sentence describing what to actually DO for the concurrency family
 *
 * A flow graph only shows the paths its author imagined. These seven are the breakage classes it
 * structurally cannot draw, and an off-map defect is worth more than an on-map one because it is
 * behaviour the flow requires that nobody wrote down.
 *
 * Keys stay 1:1 with `qaOffMapFamilyContract`; a statics file cannot import a contract, so the
 * colocated test's full-value assertion is what pins that.
 */

export const qaOffMapProbeStatics = {
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
} as const;
