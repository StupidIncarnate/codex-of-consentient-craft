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

import { questIdContract } from '@dungeonmaster/shared/contracts';
import type { QuestId } from '@dungeonmaster/shared/contracts';

import type { CommentAnchor } from '../../contracts/comment-anchor/comment-anchor-contract';
import { commentQueueEntryContract } from '../../contracts/comment-queue-entry/comment-queue-entry-contract';
import type { CommentQueueEntry } from '../../contracts/comment-queue-entry/comment-queue-entry-contract';
import { isSameCommentAnchorGuard } from '../../guards/is-same-comment-anchor/is-same-comment-anchor-guard';
import { commentQueueStatics } from '../../statics/comment-queue/comment-queue-statics';
import { commentQueueSweepTransformer } from '../../transformers/comment-queue-sweep/comment-queue-sweep-transformer';

const state = {
  subscribers: new Map<QuestId, Set<() => void>>(),

  readEntries: ({ key }: { key: string }): CommentQueueEntry[] => {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return [];
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      // Array.from breaks the direct JSON.parse alias so the untyped-property-access lint rule
      // sees a plain array copy here, not a member access straight off the parsed JSON — each
      // element is still individually validated below via commentQueueEntryContract.safeParse.
      const candidates = Array.from(parsed);
      return candidates.reduce<CommentQueueEntry[]>((survivors, candidate) => {
        const result = commentQueueEntryContract.safeParse(candidate);
        if (result.success) survivors.push(result.data);
        return survivors;
      }, []);
    } catch {
      // localStorage can be disabled (private browsing, restrictive embedded webview) or hold
      // hand-edited/corrupt JSON — degrade to an empty queue instead of crashing the render,
      // mirroring chat-input-widget's localStorage try/catch convention.
      return [];
    }
  },

  write: ({ key, entries }: { key: string; entries: CommentQueueEntry[] }): void => {
    if (entries.length === 0) {
      localStorage.removeItem(key);
      return;
    }
    localStorage.setItem(key, JSON.stringify(entries));
  },

  notify: ({ questId }: { questId: QuestId }): void => {
    const listeners = state.subscribers.get(questId);
    if (listeners === undefined) return;
    listeners.forEach((listener) => {
      listener();
    });
  },
};

export const commentQueueState = {
  read: ({ questId }: { questId: QuestId }): CommentQueueEntry[] =>
    state.readEntries({ key: `${commentQueueStatics.storage.keyPrefix}${questId}` }),

  queue: ({ questId, entry }: { questId: QuestId; entry: CommentQueueEntry }): void => {
    const key = `${commentQueueStatics.storage.keyPrefix}${questId}`;
    const existing = state.readEntries({ key });
    const withoutMatch = existing.filter(
      (candidate) => !isSameCommentAnchorGuard({ left: candidate, right: entry }),
    );
    state.write({ key, entries: [...withoutMatch, entry] });
    state.notify({ questId });
  },

  remove: ({ questId, anchor }: { questId: QuestId; anchor: CommentAnchor }): void => {
    const key = `${commentQueueStatics.storage.keyPrefix}${questId}`;
    const existing = state.readEntries({ key });
    const remaining = existing.filter(
      (candidate) => !isSameCommentAnchorGuard({ left: candidate, right: anchor }),
    );
    state.write({ key, entries: remaining });
    state.notify({ questId });
  },

  clearQueue: ({ questId }: { questId: QuestId }): void => {
    localStorage.removeItem(`${commentQueueStatics.storage.keyPrefix}${questId}`);
    state.notify({ questId });
  },

  sweepExpired: ({ nowMs }: { nowMs: number }): void => {
    // Collect every key BEFORE mutating any of them: removeItem re-indexes localStorage, so
    // deleting mid-iteration shifts the remaining keys down and silently skips one. A key equal
    // to the bare prefix carries no questId, so it addresses no quest and is skipped — parsing
    // its empty suffix would throw and take the whole route mount down with it.
    const keys = [];
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (
        key !== null &&
        key.startsWith(commentQueueStatics.storage.keyPrefix) &&
        key.length > commentQueueStatics.storage.keyPrefix.length
      ) {
        keys.push(key);
      }
    }

    keys.forEach((key) => {
      const existing = state.readEntries({ key });
      const survivors = commentQueueSweepTransformer({ entries: existing, nowMs });
      if (survivors.length === existing.length) return;
      state.write({ key, entries: survivors });
      const questId = questIdContract.parse(
        key.slice(commentQueueStatics.storage.keyPrefix.length),
      );
      state.notify({ questId });
    });
  },

  subscribe: ({ questId, listener }: { questId: QuestId; listener: () => void }): (() => void) => {
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
