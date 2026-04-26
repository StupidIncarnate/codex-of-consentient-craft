/**
 * PURPOSE: Validates the runtime shape of the `orchestrationEventsState` singleton's `on`/`off`
 * subscription surface used by integration tests subscribing to chat-output events through a
 * `require`-based bypass of the flows/→state/ import hierarchy.
 *
 * USAGE:
 * const facade = orchestrationEventsStateFacadeContract.parse(eventsModule.orchestrationEventsState);
 * facade.on({ type: 'chat-output', handler });
 */
import { z } from 'zod';

export const orchestrationEventsStateFacadeContract = z
  .object({
    on: z.function(),
    off: z.function(),
  })
  .passthrough();

export type OrchestrationEventsStateFacade = z.infer<typeof orchestrationEventsStateFacadeContract>;
