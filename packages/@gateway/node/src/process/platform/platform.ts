/**
 * PURPOSE: Captures the current process's platform string. Reach for this over
 * `process.platform` directly so a raw-import lint rule has one name per call site to catch.
 *
 * USAGE:
 * const os = platform;
 * // Same value process.platform holds
 */

export const { platform } = process;
