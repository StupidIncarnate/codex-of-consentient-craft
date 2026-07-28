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
   * sub-agents, commits a prose git handoff, and signals an `operationStatus` of done or partial. */
  'codeweaver',
  'ward',
  'spiritmender',
  /** Flowrider: verify role — a TEST WRITER only. Reviews and extends the integration tests
   * Codeweaver left until they cover whole flows, and authors the Playwright e2e suite. Writes no
   * implementation: Codeweaver owns every implementation file, `flows/` and `startup/` included.
   * Self-scopes over ALL quest flows within one session; loops via pt N continuation items until a
   * fresh pass changes nothing. */
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
   * and applies the final cleanup. Signals an `operationStatus` of done when a pass changes
   * nothing, partial when it changed code (the orchestrator appends a pt N continuation for a
   * fresh pass). */
  'blightwarden',
  /** Bug Hunt quest type: a single TDD agent that investigates the bug, writes a failing test
   * first, then fixes it. Front of the bug-hunt work-item flow. */
  'pesteater',
]);

export type WorkItemRole = z.infer<typeof workItemRoleContract>;
