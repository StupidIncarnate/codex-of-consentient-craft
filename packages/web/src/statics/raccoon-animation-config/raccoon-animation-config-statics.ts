/**
 * PURPOSE: Defines immutable animation timing and offset values for the raccoon wizard sprite
 *
 * USAGE:
 * raccoonAnimationConfigStatics.idleIntervalMs;
 * // Returns 2000
 */

export const raccoonAnimationConfigStatics = {
  idleIntervalMs: 2000,
  thinkingIntervalMs: 500,
  toolCallIntervalMs: 300,
  bounceOffsetPx: -4,
  bounceRestPx: 0,
  scrollThresholdPx: 10,
} as const;
