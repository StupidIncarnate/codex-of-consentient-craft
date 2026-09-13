/**
 * PURPOSE: Detection markers for a dispatched agent child that dies because the account's own quota
 *   is spent (HTTP 429). Reach for these over apiOverloadRetryStatics.markers, which cover the
 *   OTHER upstream failure: a 529 means Anthropic is overloaded and waiting a minute fixes it, so
 *   that child is respawned in place. A 429 means nothing will change until the window resets, so
 *   respawning is what burns the orphan-recovery budget and blocks the quest.
 *
 * USAGE:
 * rateLimitRejectionStatics.markers;
 * // Returns the substrings Claude CLI writes on a quota refusal, consulted only for a child that
 * //   ALSO exited non-zero
 */

export const rateLimitRejectionStatics = {
  // `rate_limit` is the API's own error type and reaches stderr through the SDK's retry logging;
  // `API Error: 429` is the synthetic assistant line the CLI writes to stdout and the session
  // JSONL. The two `hit your` variants are that same synthetic line's human text, which is what a
  // transcript actually carries — measured on a session killed mid-quest:
  // "You've hit your weekly limit · resets Sep 12, 11pm (America/Los_Angeles)".
  markers: [
    'API Error: 429',
    'rate_limit_error',
    '"error":"rate_limit"',
    'hit your weekly limit',
    'hit your 5-hour limit',
  ],
  // Which window a marker names, so the hold records the one that actually refused. A line matching
  // neither is still a refusal, and the caller falls back to the five-hour window — the shorter
  // wait, so an unknown marker never strands the queue for a week.
  windowMarkers: {
    sevenDay: 'weekly limit',
    fiveHour: '5-hour limit',
  },
} as const;
