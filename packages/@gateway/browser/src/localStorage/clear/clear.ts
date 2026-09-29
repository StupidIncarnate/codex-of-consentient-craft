/**
 * PURPOSE: Empties `localStorage` and never throws — kept symmetrical with removeItem's guard,
 * since the same storage-disabled `SecurityError` a write can raise is possible here. `error` is
 * the caught value as-is, so a caller can log or report the real native error.
 *
 * USAGE:
 * clear();
 * // Returns { success: true } once storage is empty, { success: false, error } if storage refused it
 */

export const clear = (): { success: true } | { success: false; error: unknown } => {
  try {
    globalThis.localStorage.clear();
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error };
  }
};
