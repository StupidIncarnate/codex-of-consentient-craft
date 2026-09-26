/**
 * PURPOSE: Writes one key into `localStorage` and never throws. A full quota (~5MB shared across
 * the whole origin) raises `QuotaExceededError`, and private browsing that allows reads but
 * rejects writes raises `SecurityError` — both fold into `{ success: false, error }` so a caller in
 * an event handler (a keydown, a paste) never has an uncaught write unwind it, while still keeping
 * the native error available to log or report. `error` is the caught value as-is, since a browser
 * can throw something that is not an `Error` instance.
 *
 * USAGE:
 * writeItem({ key: 'dungeonmaster:comment-queue:quest-1', value: '[]' });
 * // Returns { success: true } on a real write, { success: false, error } if storage refused it
 */

export const writeItem = ({
  key,
  value,
}: {
  key: string;
  value: string;
}): { success: true } | { success: false; error: unknown } => {
  try {
    globalThis.localStorage.setItem(key, value);
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error };
  }
};
