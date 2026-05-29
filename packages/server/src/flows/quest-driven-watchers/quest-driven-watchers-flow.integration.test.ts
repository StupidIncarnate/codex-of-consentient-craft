import { QuestDrivenWatchersFlow } from './quest-driven-watchers-flow';

describe('QuestDrivenWatchersFlow', () => {
  it('VALID: {bootstrap then shutdown} => idempotent across repeat calls', () => {
    // Subsequent bootstrap calls must no-op once the reactor is installed; subsequent
    // shutdown calls must no-op once teardown has cleared the handle.
    let threw = false;
    try {
      QuestDrivenWatchersFlow.bootstrap();
      QuestDrivenWatchersFlow.bootstrap();
      QuestDrivenWatchersFlow.shutdown();
      QuestDrivenWatchersFlow.shutdown();
    } catch {
      threw = true;
    }

    expect(threw).toBe(false);
  });
});
