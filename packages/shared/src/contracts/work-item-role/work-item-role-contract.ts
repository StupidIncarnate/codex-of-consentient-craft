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
  /** Flowrider: verify OPERATOR — a TEST WRITER and reviewer first. One session owns EVERY quest
   * flow: it bundles them, dispatches a `flowrider-minion` per bundle, then reopens the files each
   * minion wrote to reject hand-waved coverage. Tests are its primary output, but it and its minions
   * MAY close an implementation hole their testing exposes, red-first; only an architectural fix or
   * one needing a product decision is left as a red test plus a `GAP:` for Siegemaster. Signals on
   * remaining scope — `done` once every observable on every flow carries a disposition, `partial`
   * only for a named remainder. */
  'flowrider',
  /** Siegemaster: verify OPERATOR — the last role that fixes behaviour, and the one with the widest
   * fix authority. One session owns EVERY quest flow: it groups them into walk-bundles, stands up ONE
   * dev server, and dispatches a `siegemaster-minion` per bundle (every DRIVING bundle strictly
   * serially, since concurrent walks share one server's state and one reset lever) to walk them by
   * hand and report measured evidence. A minion records the broken state before it may close a small
   * local hole; the operator verifies those reports, TDD-fixes what survived, and signals on
   * remaining scope. */
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
