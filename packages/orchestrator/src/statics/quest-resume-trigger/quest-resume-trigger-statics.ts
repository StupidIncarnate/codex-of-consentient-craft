/**
 * PURPOSE: Holds the closed list of ways a halted quest gets picked back up, so
 * `questResumeTriggerContract` and the suites that must cover EVERY pickup surface read one
 * source. A test cannot import a contract, so an `it.each` over the pickup surfaces can only be
 * derived — rather than hand-copied and left to go stale — from a statics tuple like this one.
 *
 * USAGE:
 * questResumeTriggerStatics.triggers;
 * // Returns ['orchestration-resume', 'recover-guild-layer-responder', 'dispatch-scan']
 */

export const questResumeTriggerStatics = {
  triggers: ['orchestration-resume', 'recover-guild-layer-responder', 'dispatch-scan'],
} as const;
