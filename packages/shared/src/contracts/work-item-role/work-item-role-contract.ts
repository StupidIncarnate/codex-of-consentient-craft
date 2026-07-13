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
  /** Codeweaver: the implementation relay worker. Each codeweaver operation item on the quest
   * operations ledger gets one codeweaver work item (session); it builds via codeweaver-minion
   * sub-agents, commits a prose git handoff, and signals done or partially_complete. */
  'codeweaver',
  'ward',
  'spiritmender',
  /** Flowrider: verify role — authors the flow-perspective test suite (integration for
   * API/CLI/server flows, e2e for UI flows) and owns the `flows/` + `startup/` implementation
   * files. Self-scopes over ALL quest flows within one session; loops via pt N continuation
   * items until a fresh pass changes nothing. */
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
   * and applies the final cleanup. Signals done when a pass changes nothing, partially_complete
   * when it changed code (the orchestrator appends a pt N continuation for a fresh pass). */
  'blightwarden',
  /** Bug Hunt quest type: a single TDD agent that investigates the bug, writes a failing test
   * first, then fixes it. Front of the bug-hunt work-item flow. */
  'pesteater',
]);

export type WorkItemRole = z.infer<typeof workItemRoleContract>;
