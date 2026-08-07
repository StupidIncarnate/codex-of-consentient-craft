/**
 * PURPOSE: Defines valid execution role values for step assignments
 *
 * USAGE:
 * executionRoleContract.parse('codeweaver');
 * // Returns: ExecutionRole branded enum value
 *
 * The enum is BUILT from `workItemRoleStatics.names` — the same tuple the server-side
 * `workItemRoleContract` builds from — so the web can never reject a role the orchestrator
 * legitimately assigns. A hand-copied literal list here has no compile-time link to that tuple: a
 * role renamed in the statics still typechecks, still lints, still passes this file's own tests,
 * and only fails at runtime when a real step carrying the new name reaches the browser.
 */

import { workItemRoleStatics } from '@dungeonmaster/shared/statics';
import { z } from 'zod';

export const executionRoleContract = z.enum(workItemRoleStatics.names);

export type ExecutionRole = z.infer<typeof executionRoleContract>;
