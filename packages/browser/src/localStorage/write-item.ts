/**
 * PURPOSE: Writes one key into `localStorage` and never throws. A full quota (~5MB shared across
 * the whole origin) raises `QuotaExceededError`, and private browsing that allows reads but
 * rejects writes raises `SecurityError` — both fold into `{ success: false }` so a caller in an
 * event handler (a keydown, a paste) never has an uncaught write unwind it.
 *
 * USAGE:
 * writeItem({ key: 'dungeonmaster:comment-queue:quest-1', value: '[]' });
 * // Returns { success: true } on a real write, { success: false } if storage refused it
 */

export const writeItem = ({ key, value }: { key: string; value: string }): { success: boolean } => {
  try {
    globalThis.localStorage.setItem(key, value);
    return { success: true };
  } catch {
    return { success: false };
  }
};
