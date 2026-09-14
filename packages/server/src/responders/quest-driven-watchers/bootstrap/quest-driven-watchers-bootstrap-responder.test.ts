import { QuestDrivenWatchersBootstrapResponder } from './quest-driven-watchers-bootstrap-responder';
import { QuestDrivenWatchersBootstrapResponderProxy } from './quest-driven-watchers-bootstrap-responder.proxy';

describe('QuestDrivenWatchersBootstrapResponder', () => {
  it('VALID: {fresh boot, no quests} => returns handle whose stop is idempotent', async () => {
    QuestDrivenWatchersBootstrapResponderProxy();

    const handle = await QuestDrivenWatchersBootstrapResponder();
    let threw = false;
    try {
      handle.stop();
      handle.stop();
    } catch {
      threw = true;
    }

    expect(threw).toBe(false);
  });

  it('VALID: {fresh boot} => asks the outbox watcher to empty the bus, as its single per-boot owner', async () => {
    // `StartServer` runs this bootstrap once per HTTP server process and an MCP child never
    // reaches it, so this is the one watcher allowed to truncate `event-outbox.jsonl` — and the
    // only thing bounding that file's growth. Every other bootstrap must leave the flag off.
    const proxy = QuestDrivenWatchersBootstrapResponderProxy();

    const handle = await QuestDrivenWatchersBootstrapResponder();
    const requestedReset = proxy.outboxProxy.getCapturedResetOnStart();

    handle.stop();

    expect(requestedReset).toBe(true);
  });
});
