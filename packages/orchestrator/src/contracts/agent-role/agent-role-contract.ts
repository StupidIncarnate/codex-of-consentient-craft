/**
 * PURPOSE: Defines valid agent role values for orchestration
 *
 * USAGE:
 * agentRoleContract.parse('pathseeker-walk');
 * // Returns: 'pathseeker-walk' as AgentRole
 */

import { z } from 'zod';

export const agentRoleContract = z.enum([
  /** @deprecated Retained for forward-compat with quest.json files that still
   * reference the monolithic pathseeker role. New work items must use one of
   * the four pathseeker-* variants below. */
  'pathseeker',
  'pathseeker-surface',
  'pathseeker-dedup',
  'pathseeker-assertion-correctness',
  'pathseeker-walk',
  'codeweaver',
  'spiritmender',
  'lawbringer',
  /** Flowrider — authors the flow-perspective test suite (integration/e2e) and owns the
   * `flows/` + `startup/` implementation files. Dispatched one per quest flow, chained. */
  'flowrider',
  'siegemaster',
  /** Blightwarden minions — five report-only parallel finders (one per cross-cutting concern).
   * Dispatched as work items; each writes a `PlanningBlightReport` and never fixes or blocks. */
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
