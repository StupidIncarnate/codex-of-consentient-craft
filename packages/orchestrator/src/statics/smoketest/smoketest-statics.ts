/**
 * PURPOSE: Fixed identifiers, timeouts and fixture text used by all smoketest scenarios so prompts
 * and harness-written quest data reference known values without per-run templating
 *
 * USAGE:
 * smoketestStatics.questId;
 * // Returns: '00000000-0000-0000-0000-000000000000'
 * smoketestStatics.signoffEvidence;
 * // Returns the evidence string the harness writes on every sign-off it fabricates
 *
 * `signoffEvidence` is deliberately a confession rather than a description. A smoketest quest is a
 * durable file a human opens later, and a plausible-looking `evidence` line there is indistinguishable
 * from one a real Siegemaster wrote — so the string says outright that nothing was verified.
 */

export const smoketestStatics = {
  questId: '00000000-0000-0000-0000-000000000000',
  defaultTimeoutMs: 60000,
  orchestrationCaseTimeoutMs: 300000,
  signoffEvidence:
    'SMOKETEST FIXTURE — NOT A VERIFICATION. The smoketest harness wrote this sign-off so a scripted agent could clear the signal-back completion gate. No test was authored, no path was walked, no system was observed.',
} as const;
