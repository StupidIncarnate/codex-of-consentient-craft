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
});
