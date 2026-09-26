/**
 * PURPOSE: Lists every key currently in `localStorage`, replacing the hand-rolled
 * `for (i = 0; i < localStorage.length; i++) localStorage.key(i)` loop callers wrote themselves.
 * Storage disabled (private browsing, cookies blocked) fails enumeration outright, so this
 * returns `{ success: false, error }` rather than folding that into an empty list — an empty
 * result and a failed scan mean different things to a caller sweeping storage for expired
 * entries, matching writeItem/removeItem's `{ success, error }` shape rather than degrading
 * silently the way readItem does.
 *
 * USAGE:
 * keys();
 * // Returns { success: true, keys: [...] }, or { success: false, error } if storage can't be scanned
 */

export const keys = (): { success: true; keys: string[] } | { success: false; error: unknown } => {
  try {
    const result: string[] = [];
    for (let index = 0; index < globalThis.localStorage.length; index += 1) {
      const key = globalThis.localStorage.key(index);
      if (key !== null) result.push(key);
    }
    return { success: true, keys: result };
  } catch (error: unknown) {
    return { success: false, error };
  }
};
