/**
 * PURPOSE: Reads and writes the per-quest queued-comment array in localStorage, keyed so quest A's
 * queue and quest B's queue never clobber each other, and fans out change notifications to every
 * subscriber for that quest. The popover on each flow-diagram card, and (in a later piece) the
 * queue bar pinned above the action bar, all read the same queue and re-render together whenever
 * any one of them mutates it.
 *
 * USAGE:
 * commentQueueState.queue({ questId, entry });
 * commentQueueState.read({ questId });
 * // Returns CommentQueueEntry[] for that quest — an edited comment replaces its prior entry
 * commentQueueState.sweepExpired({ nowMs: Date.now() });
 * // Purges every quest's key of entries older than 7 days, at route mount
 * const unsubscribe = commentQueueState.subscribe({ questId, listener: () => { ... } });
 * // unsubscribe() stops further notifications for that listener
 */

import { console } from '#gateway/browser/console';
import { keys, readItem, removeItem, writeItem } from '#gateway/browser/localStorage';
import { questContract } from '@dungeonmaster/shared/contracts';
import type { Quest } from '@dungeonmaster/shared/contracts';

import { commentAnchorContract } from '../../contracts/comment-anchor/comment-anchor-contract';
import type { CommentAnchor } from '../../contracts/comment-anchor/comment-anchor-contract';
import { commentQueueStoredContract } from '../../contracts/comment-queue-stored/comment-queue-stored-contract';
import type { CommentQueueEntry } from '../../contracts/comment-queue-entry/comment-queue-entry-contract';
import { isSameCommentAnchorGuard } from '../../guards/is-same-comment-anchor/is-same-comment-anchor-guard';
import { commentQueueStatics } from '../../statics/comment-queue/comment-queue-statics';
import { commentQueueSweepTransformer } from '../../transformers/comment-queue-sweep/comment-queue-sweep-transformer';

const state = {
  subscribers: new Map<Quest['id'], Set<() => void>>(),

  readEntries: ({ key }: { key: string }): CommentQueueEntry[] => {
    // readItem already degrades a disabled/unreadable storage (private browsing, a locked-down
    // embedded webview) to null, the same shape as an absent key — nothing here needs to guard
    // against that any more. JSON.parse still throws on hand-edited/corrupt JSON, which readItem
    // never sees since it returns the raw string, so that one case still needs a catch.
    const raw = readItem({ key });
    if (raw === null) return [];
    try {
      // The stored contract validates each element on its own and nulls the ones that fail, so one
      // bad entry never drops the rest of the queue.
      return commentQueueStoredContract
        .parse(JSON.parse(raw))
        .reduce<CommentQueueEntry[]>((survivors, candidate) => {
          if (candidate !== null) survivors.push(candidate);
          return survivors;
        }, []);
    } catch {
      return [];
    }
  },

  write: ({ key, entries }: { key: string; entries: CommentQueueEntry[] }): void => {
    // writeItem/removeItem already guard the storage-refuses-the-write case (a full ~5MB quota,
    // private browsing / a restrictive embedded webview) and answer { success: false, error }
    // instead of throwing, so an escaping error can no longer unwind the React keydown handler
    // mid-flight and take the queue bar's own re-render with it. `error` carries the native
    // QuotaExceededError/SecurityError as-is, so the caught value is what gets logged.
    const result =
      entries.length === 0
        ? removeItem({ key })
        : writeItem({ key, value: JSON.stringify(entries) });
    if (!result.success) {
      console.error('[comment-queue] failed to persist the queue', result.error);
    }
  },

  notify: ({ questId }: { questId: Quest['id'] }): void => {
    const listeners = state.subscribers.get(questId);
    if (listeners === undefined) return;
    listeners.forEach((listener) => {
      listener();
    });
  },
};

export const commentQueueState = {
  read: ({ questId }: { questId: Quest['id'] }): CommentQueueEntry[] =>
    state.readEntries({ key: `${commentQueueStatics.storage.keyPrefix}${questId}` }),

  queue: ({ questId, entry }: { questId: Quest['id']; entry: CommentQueueEntry }): void => {
    const key = `${commentQueueStatics.storage.keyPrefix}${questId}`;
    const existing = state.readEntries({ key });
    const withoutMatch = existing.filter(
      (candidate) =>
        !isSameCommentAnchorGuard({
          left: commentAnchorContract.parse(candidate),
          right: commentAnchorContract.parse(entry),
        }),
    );
    state.write({ key, entries: [...withoutMatch, entry] });
    state.notify({ questId });
  },

  remove: ({ questId, anchor }: { questId: Quest['id']; anchor: CommentAnchor }): void => {
    const key = `${commentQueueStatics.storage.keyPrefix}${questId}`;
    const existing = state.readEntries({ key });
    const remaining = existing.filter(
      (candidate) =>
        !isSameCommentAnchorGuard({ left: commentAnchorContract.parse(candidate), right: anchor }),
    );
    state.write({ key, entries: remaining });
    state.notify({ questId });
  },

  clearQueue: ({ questId }: { questId: Quest['id'] }): void => {
    // Through state.write rather than a bare removeItem: an empty array is already its removal
    // case, so this inherits the one guard against a storage that refuses writes.
    state.write({ key: `${commentQueueStatics.storage.keyPrefix}${questId}`, entries: [] });
    state.notify({ questId });
  },

  sweepExpired: ({ nowMs }: { nowMs: number }): void => {
    // keys() distinguishes a storage that cannot be enumerated at all (cookies blocked, private
    // browsing) from a genuinely empty one, so that failure is logged here and the sweep is
    // skipped rather than folded silently into "nothing to sweep" — a route mount that calls this
    // never white-screens over it, and skipping only leaves expired entries in place one session
    // longer. A successful scan returns a full snapshot rather than a live view, which is what
    // this filter needs: removeItem re-indexes localStorage, so mutating mid-enumeration would
    // shift the remaining keys down and silently skip one. A key equal to the bare prefix carries
    // no questId, so it addresses no quest and is skipped — parsing its empty suffix would throw
    // and take the whole route mount down with it.
    const scan = keys();
    if (!scan.success) {
      console.error('[comment-queue] failed to scan storage for expiry', scan.error);
      return;
    }
    const matchingKeys = scan.keys.filter(
      (key) =>
        key.startsWith(commentQueueStatics.storage.keyPrefix) &&
        key.length > commentQueueStatics.storage.keyPrefix.length,
    );

    matchingKeys.forEach((key) => {
      const existing = state.readEntries({ key });
      const survivors = commentQueueSweepTransformer({ entries: existing, nowMs });
      if (survivors.length === existing.length) return;
      state.write({ key, entries: survivors });
      const questId = questContract.shape.id.parse(
        key.slice(commentQueueStatics.storage.keyPrefix.length),
      );
      state.notify({ questId });
    });
  },

  subscribe: ({
    questId,
    listener,
  }: {
    questId: Quest['id'];
    listener: () => void;
  }): (() => void) => {
    const listeners = state.subscribers.get(questId) ?? new Set<() => void>();
    listeners.add(listener);
    state.subscribers.set(questId, listeners);

    return (): void => {
      const current = state.subscribers.get(questId);
      if (current === undefined) return;
      current.delete(listener);
      if (current.size === 0) state.subscribers.delete(questId);
    };
  },

  resetSubscribers: (): void => {
    // Production never calls this — every subscriber unsubscribes on unmount. It exists so a
    // test harness can isolate cases without stale listeners from a prior test firing.
    state.subscribers.clear();
  },
} as const;
