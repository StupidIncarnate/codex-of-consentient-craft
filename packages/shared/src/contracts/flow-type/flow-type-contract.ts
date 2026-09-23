/**
 * PURPOSE: Defines the FlowType enum distinguishing runtime (user-walked) from operational (task-sequence) flows
 *
 * USAGE:
 * flowTypeContract.parse('runtime');
 * // Returns: 'runtime' as FlowType
 *
 * A runtime flow is something the system executes repeatedly at runtime when invoked — UI click, API
 * request, queue message, CLI command, ESLint rule execution. It has branches and is walkable by
 * Siegemaster to derive test scenarios.
 *
 * An operational flow is a one-time task sequence executed by the engineer or Codeweaver to achieve a
 * state change — refactor sweep, infrastructure setup, lint rule registration. Its units are settled
 * inside the CODEWEAVER family: the session that made the change is the one that reads the tree back,
 * and its reviewer confirms the end state by opening files. Flowrider is measured over `runtime`
 * flows alone (`stepScopeStatics.byFamilyStep.flowrider.review.flowTypes`, in
 * `@dungeonmaster/orchestrator`) — there is no repeatable walk for a suite to assert, and a test that
 * a file is ABSENT goes green the day it is written and is blind afterwards.
 */

import { z } from 'zod';

export const flowTypeContract = z.enum(['runtime', 'operational']);

export type FlowType = z.infer<typeof flowTypeContract>;
