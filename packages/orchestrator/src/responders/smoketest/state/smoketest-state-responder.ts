/**
 * PURPOSE: Returns the current smoketest run state (active run + recent events) so the web drawer can restore or stream
 *
 * USAGE:
 * const state = SmoketestStateResponder();
 * // Returns: { active: ActiveSmoketestRun | null, events: readonly unknown[] }
 */

import type { ActiveSmoketestRun } from '../../../contracts/active-smoketest-run/active-smoketest-run-contract';
import { smoketestRunState } from '../../../state/smoketest-run/smoketest-run-state';

export const SmoketestStateResponder = (): {
  active: ActiveSmoketestRun | null;
  events: readonly unknown[];
} => ({
  active: smoketestRunState.getActive(),
  events: smoketestRunState.getRecentEvents(),
});
