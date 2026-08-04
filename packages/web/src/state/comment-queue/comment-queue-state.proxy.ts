import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import type { QuestId } from '@dungeonmaster/shared/contracts';

import type { CommentQueueEntry } from '../../contracts/comment-queue-entry/comment-queue-entry-contract';
import { commentQueueStatics } from '../../statics/comment-queue/comment-queue-statics';

import { commentQueueState } from './comment-queue-state';

const WRITE_FAILURE_LOG_PREFIX = '[comment-queue] failed to persist the queue';
const SCAN_FAILURE_LOG_PREFIX = '[comment-queue] failed to scan storage for expiry';

export const commentQueueStateProxy = (): {
  setupEmptyStorage: () => void;
  seedQueue: (params: { questId: QuestId; entries: CommentQueueEntry[] }) => void;
  seedRawValue: (params: { questId: QuestId; value: string }) => void;
  seedPrefixOnlyKey: (params: { value: string }) => void;
  setupWriteRejected: (params: { questId: QuestId }) => void;
  setupRemoveRejected: (params: { questId: QuestId }) => void;
  setupScanRejected: () => void;
  writeFailureLogs: () => unknown[];
  scanFailureLogs: () => unknown[];
  readRawValue: (params: { questId: QuestId }) => unknown;
  readPrefixOnlyValue: () => unknown;
  hasKey: (params: { questId: QuestId }) => boolean;
} => {
  // passthrough: true — console.error is a shared sink; React's own internal warnings also flow
  // through it and must keep printing normally, not throw for being unstaged.
  const consoleErrorHandle = registerSpyOn({
    object: globalThis.console,
    method: 'error',
    passthrough: true,
  });

  return {
    setupEmptyStorage: (): void => {
      localStorage.clear();
      commentQueueState.resetSubscribers();
    },

    seedQueue: ({ questId, entries }: { questId: QuestId; entries: CommentQueueEntry[] }): void => {
      localStorage.setItem(
        `${commentQueueStatics.storage.keyPrefix}${questId}`,
        JSON.stringify(entries),
      );
    },

    seedRawValue: ({ questId, value }: { questId: QuestId; value: string }): void => {
      localStorage.setItem(`${commentQueueStatics.storage.keyPrefix}${questId}`, value);
    },

    // The key equal to the bare prefix, carrying no questId at all. Nothing in the app writes it —
    // a hand-edited or foreign-tab localStorage can. It exists here so a test can prove the scan
    // skips it rather than slicing an empty questId out of it.
    seedPrefixOnlyKey: ({ value }: { value: string }): void => {
      localStorage.setItem(commentQueueStatics.storage.keyPrefix, value);
    },

    // A storage that reads fine but refuses this quest's WRITE — the shape a full 5MB quota and a
    // private-browsing/embedded-webview storage both take. Addressed to the one key so the proxy's
    // own seeding still works; passthrough leaves every other key writable.
    setupWriteRejected: ({ questId }: { questId: QuestId }): void => {
      // Storage.prototype, not the localStorage instance: jsdom exposes localStorage as an exotic
      // object whose own properties cannot be redefined, so a spy has to go on the prototype.
      const setItemHandle = registerSpyOn({
        object: Storage.prototype,
        method: 'setItem',
        passthrough: true,
      });
      setItemHandle
        .calledWith([`${commentQueueStatics.storage.keyPrefix}${questId}`])
        .throws(new Error('QuotaExceededError'));
    },

    // A storage that refuses removal — the same disabled-storage environment seen from the
    // clearQueue / emptied-queue side, where the write is a removeItem rather than a setItem.
    setupRemoveRejected: ({ questId }: { questId: QuestId }): void => {
      const removeItemHandle = registerSpyOn({
        object: Storage.prototype,
        method: 'removeItem',
        passthrough: true,
      });
      removeItemHandle
        .calledWith([`${commentQueueStatics.storage.keyPrefix}${questId}`])
        .throws(new Error('SecurityError'));
    },

    // A storage that cannot even be enumerated. This is the shape a cookies-blocked Chrome takes,
    // and it matters because the expiry sweep scans every key at route mount.
    setupScanRejected: (): void => {
      const keyHandle = registerSpyOn({
        object: Storage.prototype,
        method: 'key',
        passthrough: true,
      });
      keyHandle.calledWith([0]).throws(new Error('SecurityError'));
    },

    writeFailureLogs: (): unknown[] => consoleErrorHandle.callsMatching([WRITE_FAILURE_LOG_PREFIX]),

    scanFailureLogs: (): unknown[] => consoleErrorHandle.callsMatching([SCAN_FAILURE_LOG_PREFIX]),

    readRawValue: ({ questId }: { questId: QuestId }): unknown =>
      localStorage.getItem(`${commentQueueStatics.storage.keyPrefix}${questId}`),

    readPrefixOnlyValue: (): unknown => localStorage.getItem(commentQueueStatics.storage.keyPrefix),

    hasKey: ({ questId }: { questId: QuestId }): boolean =>
      localStorage.getItem(`${commentQueueStatics.storage.keyPrefix}${questId}`) !== null,
  };
};
