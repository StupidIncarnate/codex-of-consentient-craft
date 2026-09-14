import { BaseNameStub } from '@dungeonmaster/testing';
import { QuestIdStub } from '@dungeonmaster/shared/contracts';

import { questOutboxHarness } from '../../../../test/harnesses/quest-outbox/quest-outbox.harness';

import { questOutboxWatchBroker } from './quest-outbox-watch-broker';

const TEST_TIMEOUT_MS = 20000;

describe('questOutboxWatchBroker against a real event-outbox.jsonl', () => {
  const harness = questOutboxHarness();

  it(
    'VALID: {one watcher, one line appended} => the listener receives that questId',
    async () => {
      const { homeDir, end } = harness.begin({ name: BaseNameStub({ value: 'outbox-deliver' }) });
      const listener = harness.listener();

      const watcher = await questOutboxWatchBroker(listener.callbacks);
      harness.appendQuestLine({ homeDir, questId: QuestIdStub({ value: 'add-auth' }) });
      await harness.awaitQuestIds({ listener, count: 1 });

      const received = listener.questIds();
      const errors = listener.errors();

      watcher.stop();
      await end();

      expect(received).toStrictEqual(['add-auth']);
      expect(errors).toStrictEqual([]);
    },
    TEST_TIMEOUT_MS,
  );

  it(
    'VALID: {a second watcher starts while a line sits in the outbox} => that line is still on disk afterwards',
    async () => {
      // The defect this pins: every bootstrap that started a watcher TRUNCATED the shared bus
      // first, so the second one to boot destroyed whatever the first had not read yet. Reading
      // the file back is the only way to see the destruction — a delivery assertion cannot, because
      // the surviving watcher re-reads from offset zero once the truncate's own change event lands
      // and can appear to recover from a loss it actually took.
      const { homeDir, end } = harness.begin({ name: BaseNameStub({ value: 'outbox-survives' }) });
      const first = harness.listener();
      const second = harness.listener();

      const firstWatcher = await questOutboxWatchBroker(first.callbacks);
      harness.appendQuestLine({ homeDir, questId: QuestIdStub({ value: 'add-auth' }) });
      await harness.awaitQuestIds({ listener: first, count: 1 });

      const secondWatcher = await questOutboxWatchBroker(second.callbacks);
      await harness.awaitQuiet();

      const onDisk = harness.readOutboxQuestIds({ homeDir });

      firstWatcher.stop();
      secondWatcher.stop();
      await end();

      expect(onDisk).toStrictEqual(['add-auth']);
    },
    TEST_TIMEOUT_MS,
  );

  it(
    'VALID: {two watchers already running, one line appended} => both listeners receive that questId',
    async () => {
      const { homeDir, end } = harness.begin({ name: BaseNameStub({ value: 'outbox-fan-out' }) });
      const first = harness.listener();
      const second = harness.listener();

      const firstWatcher = await questOutboxWatchBroker(first.callbacks);
      const secondWatcher = await questOutboxWatchBroker(second.callbacks);

      harness.appendQuestLine({ homeDir, questId: QuestIdStub({ value: 'fix-login-bug' }) });
      await harness.awaitQuestIds({ listener: first, count: 1 });
      await harness.awaitQuestIds({ listener: second, count: 1 });

      const firstReceived = first.questIds();
      const secondReceived = second.questIds();

      firstWatcher.stop();
      secondWatcher.stop();
      await end();

      expect(firstReceived).toStrictEqual(['fix-login-bug']);
      expect(secondReceived).toStrictEqual(['fix-login-bug']);
    },
    TEST_TIMEOUT_MS,
  );

  it(
    'VALID: {lines already in the outbox when a watcher starts} => none of them are re-fired, and the next append is',
    async () => {
      // Nothing empties the bus on a watcher's behalf any more, so the tail has to start at the
      // file's current end. A watcher draining from zero would re-broadcast quest-modified for
      // every event still on disk on every server boot.
      const { homeDir, end } = harness.begin({ name: BaseNameStub({ value: 'outbox-no-replay' }) });
      const listener = harness.listener();

      harness.appendQuestLine({ homeDir, questId: QuestIdStub({ value: 'already-written' }) });

      const watcher = await questOutboxWatchBroker(listener.callbacks);
      harness.appendQuestLine({ homeDir, questId: QuestIdStub({ value: 'written-after' }) });
      await harness.awaitQuestIds({ listener, count: 1 });
      await harness.awaitQuiet();

      const received = listener.questIds();

      watcher.stop();
      await end();

      expect(received).toStrictEqual(['written-after']);
    },
    TEST_TIMEOUT_MS,
  );

  it(
    'EMPTY: {no outbox file at all} => the watcher creates it and delivers a line appended afterwards',
    async () => {
      const { homeDir, end } = harness.begin({ name: BaseNameStub({ value: 'outbox-absent' }) });
      const listener = harness.listener();

      harness.removeOutbox({ homeDir });

      const watcher = await questOutboxWatchBroker(listener.callbacks);
      const existsAfterStart = harness.outboxExists({ homeDir });

      harness.appendQuestLine({ homeDir, questId: QuestIdStub({ value: 'first-ever' }) });
      await harness.awaitQuestIds({ listener, count: 1 });

      const received = listener.questIds();
      const errors = listener.errors();

      watcher.stop();
      await end();

      expect(existsAfterStart).toBe(true);
      expect(received).toStrictEqual(['first-ever']);
      expect(errors).toStrictEqual([]);
    },
    TEST_TIMEOUT_MS,
  );

  it(
    'VALID: {resetOnStart: true} => the outbox is emptied at that start and later lines still reach the listener',
    async () => {
      // The single owner's boot reset — the one thing bounding the file's growth, since nothing
      // rotates or trims it anywhere else.
      const { homeDir, end } = harness.begin({ name: BaseNameStub({ value: 'outbox-reset' }) });
      const listener = harness.listener();

      harness.appendQuestLine({ homeDir, questId: QuestIdStub({ value: 'stale-history' }) });

      const watcher = await questOutboxWatchBroker({ ...listener.callbacks, resetOnStart: true });
      const onDiskAfterReset = harness.readOutboxQuestIds({ homeDir });

      harness.appendQuestLine({ homeDir, questId: QuestIdStub({ value: 'after-reset' }) });
      await harness.awaitQuestIds({ listener, count: 1 });

      const received = listener.questIds();

      watcher.stop();
      await end();

      expect(onDiskAfterReset).toStrictEqual([]);
      expect(received).toStrictEqual(['after-reset']);
    },
    TEST_TIMEOUT_MS,
  );
});
