import { QuestIdStub } from '@dungeonmaster/shared/contracts';

import { CommentAnchorStub } from '../../contracts/comment-anchor/comment-anchor.stub';
import { CommentQueueEntryStub } from '../../contracts/comment-queue-entry/comment-queue-entry.stub';
import { commentQueueStatics } from '../../statics/comment-queue/comment-queue-statics';

import { commentQueueState } from './comment-queue-state';
import { commentQueueStateProxy } from './comment-queue-state.proxy';

const NOW_MS = Date.parse('2026-07-28T00:00:00.000Z');
const DAY_MS = commentQueueStatics.expiry.msPerDay;

describe('commentQueueState', () => {
  describe('read()', () => {
    it('EMPTY: {key absent} => returns empty array', () => {
      const proxy = commentQueueStateProxy();
      proxy.setupEmptyStorage();
      const questId = QuestIdStub({ value: 'quest-a' });

      expect(commentQueueState.read({ questId })).toStrictEqual([]);
    });

    it('VALID: {key holds two entries} => returns both entries', () => {
      const proxy = commentQueueStateProxy();
      proxy.setupEmptyStorage();
      const questId = QuestIdStub({ value: 'quest-a' });
      const first = CommentQueueEntryStub({ nodeId: 'login-page' });
      const second = CommentQueueEntryStub({ nodeId: 'dashboard' });
      proxy.seedQueue({ questId, entries: [first, second] });

      expect(commentQueueState.read({ questId })).toStrictEqual([first, second]);
    });

    it('EMPTY: {key holds malformed JSON} => returns empty array', () => {
      const proxy = commentQueueStateProxy();
      proxy.setupEmptyStorage();
      const questId = QuestIdStub({ value: 'quest-a' });
      proxy.seedRawValue({ questId, value: 'not json' });

      expect(commentQueueState.read({ questId })).toStrictEqual([]);
    });

    it('EMPTY: {key holds a JSON object rather than an array} => returns empty array', () => {
      const proxy = commentQueueStateProxy();
      proxy.setupEmptyStorage();
      const questId = QuestIdStub({ value: 'quest-a' });
      proxy.seedRawValue({ questId, value: '{"flowId":"login-flow"}' });

      expect(commentQueueState.read({ questId })).toStrictEqual([]);
    });

    it('VALID: {array holds one valid and one structurally invalid entry} => returns only the valid one', () => {
      const proxy = commentQueueStateProxy();
      proxy.setupEmptyStorage();
      const questId = QuestIdStub({ value: 'quest-a' });
      const valid = CommentQueueEntryStub({});
      proxy.seedRawValue({
        questId,
        value: JSON.stringify([valid, { flowId: 'login-flow', nodeId: 'login-page' }]),
      });

      expect(commentQueueState.read({ questId })).toStrictEqual([valid]);
    });
  });

  describe('queue()', () => {
    it('VALID: {queue onto an absent key} => creates the key holding exactly that entry', () => {
      const proxy = commentQueueStateProxy();
      proxy.setupEmptyStorage();
      const questId = QuestIdStub({ value: 'quest-a' });
      const entry = CommentQueueEntryStub({});

      commentQueueState.queue({ questId, entry });

      expect(commentQueueState.read({ questId })).toStrictEqual([entry]);
    });

    it('VALID: {queue a different anchor} => both entries survive with the new one last', () => {
      const proxy = commentQueueStateProxy();
      proxy.setupEmptyStorage();
      const questId = QuestIdStub({ value: 'quest-a' });
      const existing = CommentQueueEntryStub({ nodeId: 'login-page' });
      const added = CommentQueueEntryStub({ nodeId: 'dashboard' });
      proxy.seedQueue({ questId, entries: [existing] });

      commentQueueState.queue({ questId, entry: added });

      expect(commentQueueState.read({ questId })).toStrictEqual([existing, added]);
    });

    it('VALID: {re-queue the same anchor} => replaces the entry with the new text and createdAt', () => {
      const proxy = commentQueueStateProxy();
      proxy.setupEmptyStorage();
      const questId = QuestIdStub({ value: 'quest-a' });
      const original = CommentQueueEntryStub({
        text: 'first draft',
        createdAt: '2026-07-01T12:00:00.000Z',
      });
      const edited = CommentQueueEntryStub({
        text: 'edited text',
        createdAt: '2026-07-20T09:30:00.000Z',
      });
      proxy.seedQueue({ questId, entries: [original] });

      commentQueueState.queue({ questId, entry: edited });

      expect(commentQueueState.read({ questId })).toStrictEqual([edited]);
    });

    it('VALID: {observable anchor and node anchor on the same nodeId} => both survive as distinct entries', () => {
      const proxy = commentQueueStateProxy();
      proxy.setupEmptyStorage();
      const questId = QuestIdStub({ value: 'quest-a' });
      const nodeEntry = CommentQueueEntryStub({ nodeId: 'login-page' });
      const observableEntry = CommentQueueEntryStub({
        nodeId: 'login-page',
        observableId: 'login-redirects-to-dashboard',
      });
      proxy.seedQueue({ questId, entries: [nodeEntry] });

      commentQueueState.queue({ questId, entry: observableEntry });

      expect(commentQueueState.read({ questId })).toStrictEqual([nodeEntry, observableEntry]);
    });

    it('ERROR: {localStorage refuses the write} => leaves the existing queue intact instead of throwing', () => {
      const proxy = commentQueueStateProxy();
      proxy.setupEmptyStorage();
      const questId = QuestIdStub({ value: 'quest-a' });
      const existing = CommentQueueEntryStub({ nodeId: 'login-page' });
      const added = CommentQueueEntryStub({ nodeId: 'dashboard' });
      proxy.seedQueue({ questId, entries: [existing] });
      proxy.setupWriteRejected({ questId });

      commentQueueState.queue({ questId, entry: added });

      expect(commentQueueState.read({ questId })).toStrictEqual([existing]);
    });

    it('ERROR: {localStorage refuses the write} => reports the failure rather than swallowing it', () => {
      const proxy = commentQueueStateProxy();
      proxy.setupEmptyStorage();
      const questId = QuestIdStub({ value: 'quest-a' });
      const added = CommentQueueEntryStub({ nodeId: 'dashboard' });
      proxy.setupWriteRejected({ questId });

      commentQueueState.queue({ questId, entry: added });

      expect(proxy.writeFailureLogs()).toStrictEqual([
        ['[comment-queue] failed to persist the queue', new Error('QuotaExceededError')],
      ]);
    });
  });

  describe('storage the browser refuses', () => {
    it('ERROR: {localStorage refuses the removal} => clearQueue reports it instead of throwing', () => {
      const proxy = commentQueueStateProxy();
      proxy.setupEmptyStorage();
      const questId = QuestIdStub({ value: 'quest-a' });
      proxy.setupRemoveRejected({ questId });

      commentQueueState.clearQueue({ questId });

      expect(proxy.writeFailureLogs()).toStrictEqual([
        ['[comment-queue] failed to persist the queue', new Error('SecurityError')],
      ]);
    });

    it('ERROR: {localStorage cannot be enumerated} => the expiry sweep leaves the route mount standing', () => {
      const proxy = commentQueueStateProxy();
      proxy.setupEmptyStorage();
      const questId = QuestIdStub({ value: 'quest-a' });
      const entry = CommentQueueEntryStub({ createdAt: '2026-07-27T00:00:00.000Z' });
      proxy.seedQueue({ questId, entries: [entry] });
      proxy.setupScanRejected();

      commentQueueState.sweepExpired({ nowMs: NOW_MS });

      expect(commentQueueState.read({ questId })).toStrictEqual([entry]);
    });

    it('ERROR: {localStorage cannot be enumerated} => reports the scan failure rather than swallowing it', () => {
      const proxy = commentQueueStateProxy();
      proxy.setupEmptyStorage();
      const questId = QuestIdStub({ value: 'quest-a' });
      proxy.seedQueue({ questId, entries: [CommentQueueEntryStub({})] });
      proxy.setupScanRejected();

      commentQueueState.sweepExpired({ nowMs: NOW_MS });

      expect(proxy.scanFailureLogs()).toStrictEqual([
        ['[comment-queue] failed to scan storage for expiry', new Error('SecurityError')],
      ]);
    });

    it('ERROR: {localStorage cannot be enumerated} => an entry that would have expired survives the skipped sweep', () => {
      const proxy = commentQueueStateProxy();
      proxy.setupEmptyStorage();
      const questId = QuestIdStub({ value: 'quest-a' });
      const stale = CommentQueueEntryStub({
        createdAt: new Date(NOW_MS - 8 * DAY_MS).toISOString(),
      });
      proxy.seedQueue({ questId, entries: [stale] });
      proxy.setupScanRejected();

      commentQueueState.sweepExpired({ nowMs: NOW_MS });

      expect(commentQueueState.read({ questId })).toStrictEqual([stale]);
    });
  });

  describe('remove()', () => {
    it('VALID: {remove the only entry} => the key is absent from localStorage', () => {
      const proxy = commentQueueStateProxy();
      proxy.setupEmptyStorage();
      const questId = QuestIdStub({ value: 'quest-a' });
      const entry = CommentQueueEntryStub({});
      proxy.seedQueue({ questId, entries: [entry] });

      commentQueueState.remove({ questId, anchor: CommentAnchorStub({}) });

      expect(proxy.hasKey({ questId })).toBe(false);
    });

    it('VALID: {remove one of two entries} => exactly the other remains', () => {
      const proxy = commentQueueStateProxy();
      proxy.setupEmptyStorage();
      const questId = QuestIdStub({ value: 'quest-a' });
      const kept = CommentQueueEntryStub({ nodeId: 'dashboard' });
      const removed = CommentQueueEntryStub({ nodeId: 'login-page' });
      proxy.seedQueue({ questId, entries: [kept, removed] });

      commentQueueState.remove({ questId, anchor: CommentAnchorStub({ nodeId: 'login-page' }) });

      expect(commentQueueState.read({ questId })).toStrictEqual([kept]);
    });

    it('VALID: {remove an anchor that is not queued} => the array is unchanged', () => {
      const proxy = commentQueueStateProxy();
      proxy.setupEmptyStorage();
      const questId = QuestIdStub({ value: 'quest-a' });
      const entry = CommentQueueEntryStub({ nodeId: 'login-page' });
      proxy.seedQueue({ questId, entries: [entry] });

      commentQueueState.remove({ questId, anchor: CommentAnchorStub({ nodeId: 'never-queued' }) });

      expect(commentQueueState.read({ questId })).toStrictEqual([entry]);
    });

    it('ERROR: {localStorage refuses the write} => leaves the existing queue intact instead of throwing', () => {
      const proxy = commentQueueStateProxy();
      proxy.setupEmptyStorage();
      const questId = QuestIdStub({ value: 'quest-a' });
      const kept = CommentQueueEntryStub({ nodeId: 'dashboard' });
      const removed = CommentQueueEntryStub({ nodeId: 'login-page' });
      proxy.seedQueue({ questId, entries: [kept, removed] });
      proxy.setupWriteRejected({ questId });

      commentQueueState.remove({ questId, anchor: CommentAnchorStub({ nodeId: 'login-page' }) });

      expect(commentQueueState.read({ questId })).toStrictEqual([kept, removed]);
    });
  });

  describe('clearQueue()', () => {
    it('VALID: {clear a populated queue} => the key is absent from localStorage', () => {
      const proxy = commentQueueStateProxy();
      proxy.setupEmptyStorage();
      const questId = QuestIdStub({ value: 'quest-a' });
      proxy.seedQueue({ questId, entries: [CommentQueueEntryStub({})] });

      commentQueueState.clearQueue({ questId });

      expect(proxy.hasKey({ questId })).toBe(false);
    });

    it("VALID: {clear quest A} => quest B's key keeps its exact raw value", () => {
      const proxy = commentQueueStateProxy();
      proxy.setupEmptyStorage();
      const questA = QuestIdStub({ value: 'quest-a' });
      const questB = QuestIdStub({ value: 'quest-b' });
      const otherEntries = [CommentQueueEntryStub({ nodeId: 'dashboard' })];
      proxy.seedQueue({ questId: questA, entries: [CommentQueueEntryStub({})] });
      proxy.seedQueue({ questId: questB, entries: otherEntries });

      commentQueueState.clearQueue({ questId: questA });

      expect(proxy.readRawValue({ questId: questB })).toBe(JSON.stringify(otherEntries));
    });

    it('VALID: {queue again after clear} => the key is recreated holding only the new entry', () => {
      const proxy = commentQueueStateProxy();
      proxy.setupEmptyStorage();
      const questId = QuestIdStub({ value: 'quest-a' });
      const fresh = CommentQueueEntryStub({ text: 'queued after clear' });
      proxy.seedQueue({ questId, entries: [CommentQueueEntryStub({ text: 'wiped' })] });
      commentQueueState.clearQueue({ questId });

      commentQueueState.queue({ questId, entry: fresh });

      expect(commentQueueState.read({ questId })).toStrictEqual([fresh]);
    });
  });

  describe('sweepExpired()', () => {
    it('VALID: {entry 8 days old} => is dropped from its key', () => {
      const proxy = commentQueueStateProxy();
      proxy.setupEmptyStorage();
      const questId = QuestIdStub({ value: 'quest-a' });
      proxy.seedQueue({
        questId,
        entries: [
          CommentQueueEntryStub({ createdAt: new Date(NOW_MS - 8 * DAY_MS).toISOString() }),
        ],
      });

      commentQueueState.sweepExpired({ nowMs: NOW_MS });

      expect(commentQueueState.read({ questId })).toStrictEqual([]);
    });

    it('VALID: {entry 6 days old} => survives the sweep', () => {
      const proxy = commentQueueStateProxy();
      proxy.setupEmptyStorage();
      const questId = QuestIdStub({ value: 'quest-a' });
      const fresh = CommentQueueEntryStub({
        createdAt: new Date(NOW_MS - 6 * DAY_MS).toISOString(),
      });
      proxy.seedQueue({ questId, entries: [fresh] });

      commentQueueState.sweepExpired({ nowMs: NOW_MS });

      expect(commentQueueState.read({ questId })).toStrictEqual([fresh]);
    });

    it('VALID: {one 8-day-old and one 1-day-old entry} => retains exactly the 1-day-old entry', () => {
      const proxy = commentQueueStateProxy();
      proxy.setupEmptyStorage();
      const questId = QuestIdStub({ value: 'quest-a' });
      const stale = CommentQueueEntryStub({
        nodeId: 'login-page',
        createdAt: new Date(NOW_MS - 8 * DAY_MS).toISOString(),
      });
      const fresh = CommentQueueEntryStub({
        nodeId: 'dashboard',
        createdAt: new Date(NOW_MS - DAY_MS).toISOString(),
      });
      proxy.seedQueue({ questId, entries: [stale, fresh] });

      commentQueueState.sweepExpired({ nowMs: NOW_MS });

      expect(commentQueueState.read({ questId })).toStrictEqual([fresh]);
    });

    it('VALID: {every entry expires} => the key is removed entirely', () => {
      const proxy = commentQueueStateProxy();
      proxy.setupEmptyStorage();
      const questId = QuestIdStub({ value: 'quest-a' });
      proxy.seedQueue({
        questId,
        entries: [
          CommentQueueEntryStub({
            nodeId: 'login-page',
            createdAt: new Date(NOW_MS - 8 * DAY_MS).toISOString(),
          }),
          CommentQueueEntryStub({
            nodeId: 'dashboard',
            createdAt: new Date(NOW_MS - 9 * DAY_MS).toISOString(),
          }),
        ],
      });

      commentQueueState.sweepExpired({ nowMs: NOW_MS });

      expect(proxy.hasKey({ questId })).toBe(false);
    });

    it('VALID: {a second quest holds only fresh entries} => its raw value is untouched and its subscriber is not notified', () => {
      const proxy = commentQueueStateProxy();
      proxy.setupEmptyStorage();
      const questA = QuestIdStub({ value: 'quest-a' });
      const questB = QuestIdStub({ value: 'quest-b' });
      const staleListener = jest.fn();
      const freshListener = jest.fn();
      const freshEntries = [
        CommentQueueEntryStub({ createdAt: new Date(NOW_MS - DAY_MS).toISOString() }),
      ];
      proxy.seedQueue({
        questId: questA,
        entries: [
          CommentQueueEntryStub({ createdAt: new Date(NOW_MS - 8 * DAY_MS).toISOString() }),
        ],
      });
      proxy.seedQueue({ questId: questB, entries: freshEntries });
      commentQueueState.subscribe({ questId: questA, listener: staleListener });
      commentQueueState.subscribe({ questId: questB, listener: freshListener });

      commentQueueState.sweepExpired({ nowMs: NOW_MS });

      expect(proxy.readRawValue({ questId: questB })).toBe(JSON.stringify(freshEntries));
      expect(staleListener).toHaveBeenCalledTimes(1);
      expect(freshListener).toHaveBeenCalledTimes(0);
    });

    it('EDGE: {a key equal to the bare prefix, holding an entry old enough to be swept} => is skipped and left byte-identical', () => {
      const proxy = commentQueueStateProxy();
      proxy.setupEmptyStorage();
      const staleAtBarePrefix = JSON.stringify([
        CommentQueueEntryStub({ createdAt: new Date(NOW_MS - 8 * DAY_MS).toISOString() }),
      ]);
      proxy.seedPrefixOnlyKey({ value: staleAtBarePrefix });
      const questId = QuestIdStub({ value: 'quest-a' });
      proxy.seedQueue({
        questId,
        entries: [
          CommentQueueEntryStub({ createdAt: new Date(NOW_MS - 8 * DAY_MS).toISOString() }),
        ],
      });

      commentQueueState.sweepExpired({ nowMs: NOW_MS });

      expect(proxy.readPrefixOnlyValue()).toBe(staleAtBarePrefix);
      expect(commentQueueState.read({ questId })).toStrictEqual([]);
    });

    it('VALID: {an unrelated localStorage key} => is left byte-identical', () => {
      const proxy = commentQueueStateProxy();
      proxy.setupEmptyStorage();
      const questId = QuestIdStub({ value: 'quest-a' });
      localStorage.setItem('dungeonmaster-chat-draft', 'my draft');
      proxy.seedQueue({
        questId,
        entries: [
          CommentQueueEntryStub({ createdAt: new Date(NOW_MS - 8 * DAY_MS).toISOString() }),
        ],
      });

      commentQueueState.sweepExpired({ nowMs: NOW_MS });

      expect(localStorage.getItem('dungeonmaster-chat-draft')).toBe('my draft');
    });
  });

  describe('subscribe()', () => {
    it('VALID: {queue, remove, then clearQueue} => the listener fires once per mutation', () => {
      const proxy = commentQueueStateProxy();
      proxy.setupEmptyStorage();
      const questId = QuestIdStub({ value: 'quest-a' });
      const listener = jest.fn();
      commentQueueState.subscribe({ questId, listener });

      commentQueueState.queue({ questId, entry: CommentQueueEntryStub({}) });
      commentQueueState.remove({ questId, anchor: CommentAnchorStub({}) });
      commentQueueState.clearQueue({ questId });

      expect(listener).toHaveBeenCalledTimes(3);
    });

    it("VALID: {quest B mutates} => quest A's listener does not fire", () => {
      const proxy = commentQueueStateProxy();
      proxy.setupEmptyStorage();
      const questA = QuestIdStub({ value: 'quest-a' });
      const questB = QuestIdStub({ value: 'quest-b' });
      const listenerA = jest.fn();
      const listenerB = jest.fn();
      commentQueueState.subscribe({ questId: questA, listener: listenerA });
      commentQueueState.subscribe({ questId: questB, listener: listenerB });

      commentQueueState.queue({ questId: questB, entry: CommentQueueEntryStub({}) });

      expect(listenerB).toHaveBeenCalledTimes(1);
      expect(listenerA).toHaveBeenCalledTimes(0);
    });

    it('VALID: {unsubscribe then mutate} => the listener stops receiving calls', () => {
      const proxy = commentQueueStateProxy();
      proxy.setupEmptyStorage();
      const questId = QuestIdStub({ value: 'quest-a' });
      const listener = jest.fn();
      const unsubscribe = commentQueueState.subscribe({ questId, listener });

      unsubscribe();
      commentQueueState.queue({ questId, entry: CommentQueueEntryStub({}) });

      expect(listener).toHaveBeenCalledTimes(0);
    });

    it('VALID: {two listeners on the same quest} => both fire on one mutation', () => {
      const proxy = commentQueueStateProxy();
      proxy.setupEmptyStorage();
      const questId = QuestIdStub({ value: 'quest-a' });
      const first = jest.fn();
      const second = jest.fn();
      commentQueueState.subscribe({ questId, listener: first });
      commentQueueState.subscribe({ questId, listener: second });

      commentQueueState.queue({ questId, entry: CommentQueueEntryStub({}) });

      expect(first).toHaveBeenCalledTimes(1);
      expect(second).toHaveBeenCalledTimes(1);
    });
  });
});
