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
  /** Blightwarden minions: `blightwarden-minion` reviews one bundle of the whole quest diff;
   * `blightwarden-crosscut-minion` audits a cross-cutting concern (security, dedup, perf,
   * integrity, dead-code) across the entire diff. Neither fixes code or blocks the quest — each
   * writes findings the `blightwarden` operator judges and applies. */
  'blightwarden-minion',
  'blightwarden-crosscut-minion',
  /** Blightwarden: verify OPERATOR — standards review across the whole quest diff. Dispatches
   * `blightwarden-minion` and `blightwarden-crosscut-minion` sub-agents, judges their findings,
   * and applies the final cleanup. Completion is COMPUTED, not remembered: every changed
   * file × concern unit carries a disposition in `quest.planningNotes.blightLedger`, and
   * signal-back recomputes the outstanding set and refuses `done` while any unit carries none.
   * Signals `partial` only for a NAMED remainder, which costs one pt-chain attempt. */
  'blightwarden',
  /** Bug Hunt quest type: a single TDD agent that investigates the bug, writes a failing test
   * first, then fixes it. Front of the bug-hunt work-item flow. */
  'pesteater',
]);

export type WorkItemRole = z.infer<typeof workItemRoleContract>;
