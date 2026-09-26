/**
 * PURPOSE: Removes one key from `localStorage` and never throws — kept symmetrical with
 * writeItem's guard rather than assumed safe, since the same storage-disabled `SecurityError`
 * that a write can raise is also possible here.
 *
 * USAGE:
 * removeItem({ key: 'dungeonmaster:comment-queue:quest-1' });
 * // Returns { success: true } on a real removal, { success: false } if storage refused it
 */

export const removeItem = ({ key }: { key: string }): { success: boolean } => {
  try {
    globalThis.localStorage.removeItem(key);
    return { success: true };
  } catch {
    return { success: false };
  }
};
