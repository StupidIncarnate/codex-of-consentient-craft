/**
 * PURPOSE: Fixes where a path gets cut and how much survives. `minSegments` is the point below
 * which eliding costs more than it saves — a three-part path is already shorter than the ellipsis
 * form — and `packagesSegment` is the monorepo fact that makes the second segment, not the first,
 * the one a reader recognises.
 *
 * USAGE:
 * pathShorteningStatics.ellipsis;
 * // Returns '…'
 */

export const pathShorteningStatics = {
  packagesSegment: 'packages',
  separator: '/',
  ellipsis: '…',
  minSegments: 4,
} as const;
