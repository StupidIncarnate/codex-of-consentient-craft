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
 * state change — refactor sweep, infrastructure setup, lint rule registration. It is verified by
 * Siegemaster checking the final state, not by walking paths.
 */

import { z } from 'zod';

export const flowTypeContract = z.enum(['runtime', 'operational']);

export type FlowType = z.infer<typeof flowTypeContract>;
