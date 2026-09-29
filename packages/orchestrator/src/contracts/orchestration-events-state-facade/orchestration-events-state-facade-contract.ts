/**
 * PURPOSE: Validates the runtime shape of the `orchestrationEventsState` singleton's `on`/`off`
 * subscription surface used by integration tests subscribing to chat-output events through a
 * `require`-based bypass of the flows/→state/ import hierarchy.
 *
 * USAGE:
 * const facade: OrchestrationEventsStateFacade = orchestrationEventsStateExtractTransformer({ rawModule });
 * facade.on({ type: 'chat-output', handler });
 */

export interface OrchestrationEventsStateFacade {
  on: (...args: unknown[]) => unknown;
  off: (...args: unknown[]) => unknown;
}
