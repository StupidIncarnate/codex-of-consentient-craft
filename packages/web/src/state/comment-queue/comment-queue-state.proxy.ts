import { console } from '#gateway/browser/console';
import { clear, readItem, writeItem } from '#gateway/browser/localStorage';
import { keysProxy } from '#gateway/browser/localStorage/keys/keys.proxy';
import { readItemProxy } from '#gateway/browser/localStorage/read-item/read-item.proxy';
import { StorageDisabledErrorStub } from '#gateway/browser/localStorage/read-item/storage-disabled-error.stub';
import { removeItemProxy } from '#gateway/browser/localStorage/remove-item/remove-item.proxy';
import { writeItemProxy } from '#gateway/browser/localStorage/write-item/write-item.proxy';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import type { Quest } from '@dungeonmaster/shared/contracts';

import type { CommentQueueEntry } from '../../contracts/comment-queue-entry/comment-queue-entry-contract';
import { commentQueueStatics } from '../../statics/comment-queue/comment-queue-statics';

import { commentQueueState } from './comment-queue-state';

const WRITE_FAILURE_LOG_PREFIX = '[comment-queue] failed to persist the queue';
const SCAN_FAILURE_LOG_PREFIX = '[comment-queue] failed to scan storage for expiry';

export const commentQueueStateProxy = (): {
  setupEmptyStorage: () => void;
  seedQueue: (params: { questId: Quest['id']; entries: CommentQueueEntry[] }) => void;
  seedRawValue: (params: { questId: Quest['id']; value: string }) => void;
  seedPrefixOnlyKey: (params: { value: string }) => void;
  setupReadRejected: (params: { questId: Quest['id'] }) => void;
  setupWriteRejected: (params: { questId: Quest['id']; error: Error }) => void;
  setupRemoveRejected: (params: { questId: Quest['id']; error: Error }) => void;
  setupScanRejected: (params: { error: Error }) => void;
  writeFailureLogs: () => unknown[];
  scanFailureLogs: () => unknown[];
  readRawValue: (params: { questId: Quest['id'] }) => unknown;
  readPrefixOnlyValue: () => unknown;
  hasKey: (params: { questId: Quest['id'] }) => boolean;
} => {
  // passthrough: true — console.error is a shared sink; React's own internal warnings also flow
  // through it and must keep printing normally, not throw for being unstaged.
  const consoleErrorHandle = registerSpyOn({
    object: console,
    method: 'error',
    passthrough: true,
  });
  const readProxy = readItemProxy();
  const writeProxy = writeItemProxy();
  const removeProxy = removeItemProxy();
  const scanProxy = keysProxy();

  return {
    setupEmptyStorage: (): void => {
      clear();
      commentQueueState.resetSubscribers();
    },

    seedQueue: ({ questId, entries }: { questId: Quest['id']; entries: CommentQueueEntry[] }): void => {
      writeItem({
        key: `${commentQueueStatics.storage.keyPrefix}${questId}`,
        value: JSON.stringify(entries),
      });
    },

    seedRawValue: ({ questId, value }: { questId: Quest['id']; value: string }): void => {
      writeItem({ key: `${commentQueueStatics.storage.keyPrefix}${questId}`, value });
    },

    // The key equal to the bare prefix, carrying no questId at all. Nothing in the app writes it —
    // a hand-edited or foreign-tab localStorage can. It exists here so a test can prove the scan
    // skips it rather than slicing an empty questId out of it.
    seedPrefixOnlyKey: ({ value }: { value: string }): void => {
      writeItem({ key: commentQueueStatics.storage.keyPrefix, value });
    },

    // A storage that throws reading this quest's key — the shape private browsing / a locked-down
    // embedded webview takes. readItem's own guard is what turns this into a degrade-to-empty-array
    // instead of a crash; this only proves the gateway wrapper is really wired in under the caller.
    setupReadRejected: ({ questId }: { questId: Quest['id'] }): void => {
      readProxy.setupReadFails({
        key: `${commentQueueStatics.storage.keyPrefix}${questId}`,
        error: StorageDisabledErrorStub(),
      });
    },

    // A storage that reads fine but refuses this quest's WRITE — the shape a full 5MB quota and a
    // private-browsing/embedded-webview storage both take. writeItemProxy addresses by key alone
    // (a prefix match against the real setItem(key, value) call), so the caller supplies only the
    // error it wants thrown back, and the test can assert that exact instance was logged.
    setupWriteRejected: ({ questId, error }: { questId: Quest['id']; error: Error }): void => {
      writeProxy.setupWriteFails({
        key: `${commentQueueStatics.storage.keyPrefix}${questId}`,
        error,
      });
    },

    // A storage that refuses removal — the same disabled-storage environment seen from the
    // clearQueue / emptied-queue side, where the write is a removeItem rather than a setItem.
    setupRemoveRejected: ({ questId, error }: { questId: Quest['id']; error: Error }): void => {
      removeProxy.setupRemoveFails({
        key: `${commentQueueStatics.storage.keyPrefix}${questId}`,
        error,
      });
    },

    // A storage that cannot even be enumerated. This is the shape a cookies-blocked Chrome takes,
    // and it matters because the expiry sweep scans every key at route mount.
    setupScanRejected: ({ error }: { error: Error }): void => {
      scanProxy.setupEnumerationFails({ error });
    },

    writeFailureLogs: (): unknown[] => consoleErrorHandle.callsMatching([WRITE_FAILURE_LOG_PREFIX]),

    scanFailureLogs: (): unknown[] => consoleErrorHandle.callsMatching([SCAN_FAILURE_LOG_PREFIX]),

    readRawValue: ({ questId }: { questId: Quest['id'] }): unknown =>
      readItem({ key: `${commentQueueStatics.storage.keyPrefix}${questId}` }),

    readPrefixOnlyValue: (): unknown => readItem({ key: commentQueueStatics.storage.keyPrefix }),

    hasKey: ({ questId }: { questId: Quest['id'] }): boolean =>
      readItem({ key: `${commentQueueStatics.storage.keyPrefix}${questId}` }) !== null,
  };
};
