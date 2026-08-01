/**
 * PURPOSE: Defines valid agent role values for orchestration
 *
 * USAGE:
 * agentRoleContract.parse('codeweaver');
 * // Returns: 'codeweaver' as AgentRole
 */

import { z } from 'zod';

export const agentRoleContract = z.enum([
  'codeweaver',
  'spiritmender',
  'lawbringer',
  /** Flowrider — operator that authors the flow-perspective test suites (integration/e2e) for ALL
   * quest flows in one session, delegating each bundle to a `flowrider-minion` and verifying the
   * result by reopening the files. Tests are its primary output; it and its minions also close the
   * implementation holes their testing exposes, red-first, handing on only the architectural ones. */
  'flowrider',
  /** Siegemaster — operator that manual-QAs ALL quest flows in one session via `siegemaster-minion`
   * walkers against one shared dev server, then TDD-fixes what they find. Widest fix authority on the
   * quest: nothing after it runs the system. */
  'siegemaster',
  /** Blightwarden minions — five report-only parallel finders (one per cross-cutting concern),
   * summoned by the blightwarden parent via the Agent tool (no work item of their own); each
   * writes a `PlanningBlightReport` and never fixes or blocks. */
  'blightwarden-security-minion',
  'blightwarden-dedup-minion',
  'blightwarden-perf-minion',
  'blightwarden-integrity-minion',
  'blightwarden-dead-code-minion',
  /** Blightwarden synthesizer — runs after the five minions, judges their reports, cleans up. */
  'blightwarden',
  'pesteater',
]);

export type AgentRole = z.infer<typeof agentRoleContract>;
