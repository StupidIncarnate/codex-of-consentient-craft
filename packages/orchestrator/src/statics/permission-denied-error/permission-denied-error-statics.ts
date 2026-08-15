/**
 * PURPOSE: The substrings that identify a permission-class failure, wherever it surfaced — a Node
 * `errno` code on a thrown fs error, or the prose git/npm write to stderr. They live in one static
 * because the routing decision they drive ("the operator has to fix this, retrying cannot") is the
 * one that OVERRIDES a step's own failure classification, so a marker added in one call site and
 * not another would make identical failures route two different ways.
 *
 * USAGE:
 * permissionDeniedErrorStatics.markers;
 * // Returns ['EACCES', 'EPERM', 'permission denied', 'Operation not permitted'] — matched
 * // case-insensitively by isPermissionDeniedErrorGuard
 */

export const permissionDeniedErrorStatics = {
  markers: ['EACCES', 'EPERM', 'permission denied', 'Operation not permitted'],
} as const;
