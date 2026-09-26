/**
 * PURPOSE: Reads one key out of `localStorage`. Storage can be disabled outright (private
 * browsing that blocks reads, a locked-down embedded webview), which throws a `SecurityError`
 * from the raw `getItem` call — this wrapper degrades that to `null`, the same shape as a key
 * that is simply absent, since no caller in this codebase distinguishes the two. The value
 * itself is returned as the raw string; JSON-parsing a stored value (and deciding what an
 * invalid one means) stays the caller's job.
 *
 * USAGE:
 * readItem({ key: 'dungeonmaster:comment-queue:quest-1' });
 * // Returns the stored string, or null if absent, storage-disabled, or otherwise unreadable
 */

export const readItem = ({ key }: { key: string }): string | null => {
  try {
    return globalThis.localStorage.getItem(key);
  } catch {
    return null;
  }
};
