/**
 * PURPOSE: The three families of minion that work a round — the phase each one occupies, not the
 * discipline it works in. One information tool serves each.
 *
 * USAGE:
 * minionFamilyContract.parse('planner');
 * // Returns: 'planner' as MinionFamily
 *
 * IT IS A PHASE, NEVER A ROLE. `agentRoleContract` enumerates the five disciplines a round can be
 * doing; this enumerates the three jobs inside any one of them. The two axes cross: there are fifteen
 * `<role>-<family>-minion` prompts, and each fetches its family's information with no role attached.
 */

import { z } from 'zod';

export const minionFamilyContract = z.enum(['planner', 'worker', 'reviewer']);

export type MinionFamily = z.infer<typeof minionFamilyContract>;
