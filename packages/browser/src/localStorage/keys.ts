/**
 * PURPOSE: Lists every key currently in `localStorage`, replacing the hand-rolled
 * `for (i = 0; i < localStorage.length; i++) localStorage.key(i)` loop callers wrote themselves.
 * Storage disabled (private browsing, cookies blocked) degrades to an empty list rather than
 * throwing out of whatever scan is enumerating keys.
 *
 * USAGE:
 * keys();
 * // Returns every key in storage, or [] if storage is disabled/unreadable
 */

export const keys = (): string[] => {
  try {
    const result: string[] = [];
    for (let index = 0; index < globalThis.localStorage.length; index += 1) {
      const key = globalThis.localStorage.key(index);
      if (key !== null) result.push(key);
    }
    return result;
  } catch {
    return [];
  }
};
