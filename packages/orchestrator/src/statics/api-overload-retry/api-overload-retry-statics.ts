/**
 * PURPOSE: Retry schedule and detection markers for a dispatched agent child that dies on an
 *   upstream Anthropic API overload (HTTP 529). Such a child exits non-zero within seconds having
 *   accomplished nothing, so respawning it immediately just re-hits the outage. The dispatcher
 *   waits the outage out IN PLACE — two tiers, tight then patient — instead of letting each death
 *   spend a slot of the orphan-recovery budget and block the quest inside a few minutes.
 *
 * USAGE:
 * apiOverloadRetryStatics.fastAttempts;
 * // Returns 10 — retries 1-10 are one minute apart, retries 11-30 are five minutes apart,
 * //   for a ~110 minute total window before the death is treated as a real crash.
 */

export const apiOverloadRetryStatics = {
  fastAttempts: 10,
  fastDelayMs: 60_000,
  slowAttempts: 20,
  slowDelayMs: 300_000,
  // Substrings Claude CLI emits when the upstream API returns an overload. `API Error: 529` is the
  // synthetic assistant line the CLI writes to stdout and the session JSONL; `overloaded_error` is
  // the API's own error type, which reaches stderr through the SDK's retry logging. A marker is
  // only ever consulted for a child that ALSO exited non-zero, so an agent merely printing one of
  // these strings (reading this file, say) cannot trigger a retry.
  markers: ['API Error: 529', '529 Overloaded', 'overloaded_error'],
} as const;
