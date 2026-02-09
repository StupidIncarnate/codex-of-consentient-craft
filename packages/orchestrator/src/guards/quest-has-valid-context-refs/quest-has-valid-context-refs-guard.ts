/**
 * PURPOSE: Validates that every observable's contextId references an existing context
 *
 * USAGE:
 * questHasValidContextRefsGuard({observables, contexts});
 * // Returns true if every observable's contextId exists in the contexts array, false otherwise
 */
import type { ContextStub, ObservableStub } from '@dungeonmaster/shared/contracts';

type Observable = ReturnType<typeof ObservableStub>;
type Context = ReturnType<typeof ContextStub>;

export const questHasValidContextRefsGuard = ({
  observables,
  contexts,
}: {
  observables?: Observable[];
  contexts?: Context[];
}): boolean => {
  if (!observables || !contexts) {
    return false;
  }

  if (observables.length === 0) {
    return true;
  }

  const contextIds = new Set(contexts.map((ctx) => ctx.id));

  return observables.every((obs) => contextIds.has(obs.contextId));
};
