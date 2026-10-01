/**
 * PURPOSE: Collects what the orchestrator emits on its in-memory event bus during an integration
 * test, and detaches every listener after each test. Reach for this when a flow's whole observable
 * effect is the events it emits — a replay flow writes nothing to disk. Each event is read back
 * with its entries reduced to their text, because a real run stamps every entry with a fresh uuid
 * and timestamp that no assertion can know in advance.
 *
 * USAGE:
 * const eventsHarness = orchestrationEventsHarness();
 * const collected = eventsHarness.collect({ types: ['chat-output', 'chat-history-complete'] });
 * ChatCommandReplayFlow({ questId, workItem, chatProcessId });
 * collected.events(); // [{ type, processId, contents, replay, workItemId }, ...] in emit order
 */
import type { OrchestrationEventType } from '@dungeonmaster/shared/contracts';

import { orchestrationEventsState } from '../../../src/state/orchestration-events/orchestration-events-state';

interface CollectedEvent {
  type: OrchestrationEventType;
  processId: unknown;
  contents: unknown[];
  replay: unknown;
  workItemId: unknown;
}

export const orchestrationEventsHarness = (): {
  afterEach: () => void;
  collect: (params: { types: readonly OrchestrationEventType[] }) => {
    events: () => readonly CollectedEvent[];
  };
} => ({
  afterEach: (): void => {
    orchestrationEventsState.removeAllListeners();
  },
  collect: ({ types }) => {
    const events: CollectedEvent[] = [];

    for (const type of types) {
      orchestrationEventsState.on({
        type,
        handler: ({ processId, payload }): void => {
          const { entries } = payload;
          events.push({
            type,
            processId,
            contents: Array.isArray(entries)
              ? entries.map((entry: unknown) =>
                  typeof entry === 'object' && entry !== null && 'content' in entry
                    ? entry.content
                    : undefined,
                )
              : [],
            replay: payload.replay,
            workItemId: payload.workItemId,
          });
        },
      });
    }

    return { events: () => events };
  },
});
