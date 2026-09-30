/**
 * PURPOSE: Bounds of a valid TCP port number, shared by the contracts that validate a port
 *
 * USAGE:
 * networkPortStatics.max; // 65_535 — highest TCP port
 */

export const networkPortStatics = {
  min: 1,
  max: 65_535,
} as const;
