/**
 * PURPOSE: Separates the one failure a fresh attempt can never clear — the operator's filesystem
 * says no — from every failure that a repair pass might. Reach for this ahead of a step's own
 * classification, never instead of it: a permission wall halts whatever step it surfaced on, so
 * this predicate deliberately knows nothing about steps and answers only "is this the wall?".
 * Reads the `errno` code alongside the message because a thrown fs rejection carries `EACCES` on
 * `code` while a git/npm child only ever writes the prose form to stderr.
 *
 * USAGE:
 * isPermissionDeniedErrorGuard({ error: new Error('EACCES: permission denied, mkdir /repo/wt') });
 * // Returns true
 * isPermissionDeniedErrorGuard({ error: 'tsc exited with code 2' });
 * // Returns false
 *
 * WHEN-NOT-TO-USE: To decide whether to RETRY a step. It names the reason a step cannot proceed,
 *   not how many attempts remain.
 */

import { permissionDeniedErrorStatics } from '../../statics/permission-denied-error/permission-denied-error-statics';

export const isPermissionDeniedErrorGuard = ({ error }: { error?: unknown }): boolean => {
  if (error === undefined || error === null) {
    return false;
  }

  const codeValue = typeof error === 'object' && 'code' in error ? Reflect.get(error, 'code') : '';
  const code = typeof codeValue === 'string' ? codeValue : '';
  const message = error instanceof Error ? error.message : '';
  const text = typeof error === 'string' ? error : '';
  const haystack = `${code} ${message} ${text}`.toLowerCase();

  return permissionDeniedErrorStatics.markers.some((marker) =>
    haystack.includes(marker.toLowerCase()),
  );
};
