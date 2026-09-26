/**
 * PURPOSE: Removes one key from `localStorage` and never throws — kept symmetrical with
 * writeItem's guard rather than assumed safe, since the same storage-disabled `SecurityError`
 * that a write can raise is also possible here. `error` is the caught value as-is, matching
 * writeItem's shape, so a caller can log or report the real native error.
 *
 * USAGE:
 * removeItem({ key: 'dungeonmaster:comment-queue:quest-1' });
 * // Returns { success: true } on a real removal, { success: false, error } if storage refused it
 */

export const removeItem = ({
  key,
}: {
  key: string;
}): { success: true } | { success: false; error: unknown } => {
  try {
    globalThis.localStorage.removeItem(key);
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error };
  }
};
