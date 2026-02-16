/**
 * PURPOSE: Constants for hex string formatting used in run ID generation
 *
 * USAGE:
 * Math.random().toString(hexFormatStatics.radix).slice(hexFormatStatics.sliceStart, hexFormatStatics.sliceEnd);
 * // Returns 4-character hex string like 'a3f1'
 */

export const hexFormatStatics = {
  radix: 16,
  sliceStart: 2,
  sliceEnd: 6,
} as const;
