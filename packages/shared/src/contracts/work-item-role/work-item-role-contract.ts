/**
 * PURPOSE: Defines which agent role or command type executes a work item
 *
 * USAGE:
 * workItemRoleContract.parse('codeweaver');
 * // Returns: 'codeweaver' as WorkItemRole
 */

import { z } from 'zod';

export const workItemRoleContract = z.enum([
  'chaoswhisperer',
  'glyphsmith',
  /** PathSeeker: the single planning work item. It classifies scope, summons
   * `pathseeker-surface`/`-dedup`/`-assertion-correctness` minions as `Agent` sub-agents, then
   * runs the architect-review walk itself. On `complete` the post-walk hook generates the
   * codeweaver chain. */
  'pathseeker',
  /** @deprecated These pathseeker sub-role values are not seeded as work items — `pathseeker`
   * summons `pathseeker-surface`/`-dedup`/`-assertion-correctness` as sub-agents and runs the walk
   * itself. Kept so quest.json files that carry these role values still parse. */
  'pathseeker-surface',
  'pathseeker-dedup',
  'pathseeker-assertion-correctness',
  'pathseeker-walk',
  'codeweaver',
  'ward',
  'spiritmender',
  /** Flowrider: authors the flow-perspective test suite (integration for API/CLI/server flows,
   * e2e for UI flows) and owns the `flows/` + `startup/` implementation files. Dispatched one
   * per quest flow, chained, after ward(changed) and before siegemaster. */
  'flowrider',
  'siegemaster',
  'lawbringer',
  /** Blightwarden minions: five report-only finders that run in parallel, one per cross-cutting
   * concern. Each audits the whole diff for its concern and writes a `PlanningBlightReport`; none
   * fixes code or blocks the quest. The `blightwarden` synthesizer runs after all five and depends
   * on them. */
  'blightwarden-security-minion',
  'blightwarden-dedup-minion',
  'blightwarden-perf-minion',
  'blightwarden-integrity-minion',
  'blightwarden-dead-code-minion',
  /** Blightwarden synthesizer: runs after the five minions, reads their reports, judges/dedups,
   * applies the final cleanup, and escalates to a pathseeker replan via `failed-replan` when it
   * cannot resolve a finding. */
  'blightwarden',
  /** Bug Hunt quest type: a single TDD agent that investigates the bug, writes a failing test
   * first, then fixes it. Front of the bug-hunt work-item flow. */
  'pesteater',
]);

export type WorkItemRole = z.infer<typeof workItemRoleContract>;
