/**
 * PURPOSE: Defines the localStorage key composition, expiry window, and popover textarea sizing
 * for the queued comment-review flow. The full storage key for a quest is
 * `storage.keyPrefix + questId` — the per-quest suffix is the whole point, so reviewing quest A
 * and then quest B never clobbers either queue. Entries older than `expiry.days` are purged from
 * that key when the quest route mounts.
 *
 * USAGE:
 * commentQueueStatics.storage.keyPrefix;
 * // Returns 'dungeonmaster-quest-comments-' — prepend a questId to get the full storage key
 * commentQueueStatics.expiry.days * commentQueueStatics.expiry.msPerDay;
 * // Returns the purge window in milliseconds
 */

export const commentQueueStatics = {
  storage: {
    keyPrefix: 'dungeonmaster-quest-comments-',
  },
  expiry: {
    days: 7,
    msPerDay: 86_400_000,
  },
  editor: {
    rows: 2,
    lineHeightPx: 18,
    verticalChromePx: 18,
  },
} as const;
