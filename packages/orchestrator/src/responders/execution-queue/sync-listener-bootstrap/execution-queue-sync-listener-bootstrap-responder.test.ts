import { QuestIdStub } from '@dungeonmaster/shared/contracts';

import { ExecutionQueueSyncListenerBootstrapResponder } from './execution-queue-sync-listener-bootstrap-responder';
import { ExecutionQueueSyncListenerBootstrapResponderProxy } from './execution-queue-sync-listener-bootstrap-responder.proxy';

// One macrotask turn drains every pending microtask chained off it (an `await` on an
// already-resolving mock never introduces a new macrotask of its own), so each call here flushes
// one real async boundary in the install chain: dungeonmasterHomeEnsureBroker resolving, the
// fs.append call resolving, and — after triggerChange() re-enters the watch callback — the
// readline 'line'/'close' events (queued via a real setImmediate inside fsWatchTailAdapterProxy)
// plus the handler's own dispatch.
const tick = async (): Promise<void> =>
  new Promise((resolve) => {
    setImmediate(resolve);
  });

describe('ExecutionQueueSyncListenerBootstrapResponder', () => {
  // Both calls happen in the SAME test, back to back with no await between them: `state.installed`
  // inside the responder module has no reset hook once a real install lands, so a second `it` block
  // can never exercise "called again before install settles" honestly — the first block's install
  // would already be permanent for the rest of the file. Calling it twice here proves BOTH the real
  // wiring (an outbox line reaches processSyncEventLayerBroker with the right shape) AND idempotence
  // (a second, concurrent call installs no second listener — only ONE dispatch happens) in one
  // self-contained test.
  it('VALID: {called twice before install settles, then a quest changes} => installs once and dispatches the sync handler', async () => {
    const proxy = ExecutionQueueSyncListenerBootstrapResponderProxy();
    proxy.reset();
    proxy.setupProcessSucceeds();
    const questId = QuestIdStub({ value: 'q-sync-listener-bootstrap' });
    // Queued for the NEXT triggerChange() — fsWatchTailAdapterProxy's mocked fs.watch never wires
    // its captured listener onto a 'change' event of its own, so the adapter's construction-time
    // synthetic emit is a no-op under this mock; only an explicit triggerChange() drives a read.
    proxy.setupLines({
      lines: [JSON.stringify({ questId, timestamp: '2026-09-13T05:00:00.000Z' })],
    });

    ExecutionQueueSyncListenerBootstrapResponder();
    ExecutionQueueSyncListenerBootstrapResponder();
    await tick(); // dungeonmasterHomeEnsureBroker + fs.append resolve; fs.watch is now registered
    proxy.triggerChange();
    await tick();
    await tick();
    await tick();
    await tick();
    await tick(); // the readline 'line'/'close' events and the dispatched handler settle

    // Exactly one dispatch, for the one staged line — a second install would have wired a second
    // listener onto the same outbox mock and doubled this.
    expect(proxy.getProcessCallArgs()).toStrictEqual([
      [
        {
          questId,
          loadQuest: expect.any(Function),
          removeByQuestId: expect.any(Function),
          updateEntryStatus: expect.any(Function),
          updateEntryActiveSession: expect.any(Function),
        },
      ],
    ]);
  });
});
