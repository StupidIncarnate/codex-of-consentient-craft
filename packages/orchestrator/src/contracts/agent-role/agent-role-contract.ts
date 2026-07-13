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
  /** Flowrider — authors the flow-perspective test suite (integration/e2e) and owns the
   * `flows/` + `startup/` implementation files. Self-scopes over ALL quest flows per session. */
  'flowrider',
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
