/**
 * PURPOSE: Validates the runtime shape of the `orchestrationEventsState` singleton's `on`/`off`
 * subscription surface used by integration tests subscribing to chat-output events through a
 * `require`-based bypass of the flows/→state/ import hierarchy.
 *
 * USAGE:
 * const facade = orchestrationEventsStateFacadeContract.parse(eventsModule.orchestrationEventsState);
 * facade.on({ type: 'chat-output', handler });
 */
import { z } from '#gateway/npm/zod';

// `on` and `off` are functions — a Zod object schema cannot check callability, so both stay out
// of the parse and are attached only through the type intersection below. `.loose()`
// carries them through `.parse()` unvalidated when a real caller supplies one.
export const orchestrationEventsStateFacadeContract = z.object({}).loose();

export type OrchestrationEventsStateFacade = z.infer<
  typeof orchestrationEventsStateFacadeContract
> & {
  on: (...args: unknown[]) => unknown;
  off: (...args: unknown[]) => unknown;
};
