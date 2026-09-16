/**
 * PURPOSE: Answers whether a value is one of the end states an ingredient's `transitions.to` lets a
 * caller ask for. Reach for this as the RUNTIME half of that list — the type refuses
 * `set({ status: 'blocked' })` at the call site, and this refuses it for a caller that never
 * typechecked (a hand-built op, or a plan assembled outside the typed chain).
 *
 * USAGE:
 * isReachableTransitionGuard({ to: 'in_progress', spec: TransitionSpecStub({ to: ['created', 'in_progress'] }) });
 * // Returns true
 */
import type { TransitionSpec } from '../../contracts/transition-spec/transition-spec-contract';

export const isReachableTransitionGuard = ({
  to,
  spec,
}: {
  to?: unknown;
  spec?: TransitionSpec;
}): boolean => {
  if (spec === undefined) {
    return false;
  }

  return spec.to.includes(to);
};
