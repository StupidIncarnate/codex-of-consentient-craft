/**
 * PURPOSE: Defines the top-bar health badge's rendered vocabulary — its four state words, its
 * testid, the silence threshold and the three offline title strings — so no label or title is a
 * literal at a render site. offlineTitleServerError carries the PREFIX only ('Server returned');
 * a statics file holds immutable values rather than a template function, so
 * health-badge-title-transformer appends the status code after it. silenceTickMs is the
 * binding's own poll period, kept well under silenceThresholdMs so the 30s boundary is caught on
 * schedule rather than approximated by a coarser interval.
 *
 * USAGE:
 * healthBadgeStatics.online;
 * // Returns 'ONLINE'
 */

export const healthBadgeStatics = {
  online: 'ONLINE',
  degraded: 'DEGRADED',
  offline: 'OFFLINE',
  checking: 'CHECKING',
  testId: 'HEALTH_BADGE',
  silenceThresholdMs: 30000,
  silenceTickMs: 1000,
  offlineTitleUnreachable: 'No response from server',
  offlineTitleServerError: 'Server returned',
  offlineTitleSilence: 'No heartbeat for 30 seconds',
} as const;
