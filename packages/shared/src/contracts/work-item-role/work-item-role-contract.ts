/**
 * PURPOSE: Defines which agent role or command type executes a work item
 *
 * USAGE:
 * workItemRoleContract.parse('codeweaver');
 * // Returns: 'codeweaver' as WorkItemRole
 *
 * The role names — and what each one means — live in `workItemRoleStatics`, so the enum, the
 * chat-role guard, and every role matrix in tests read one list.
 */

import { z } from 'zod';

import { workItemRoleStatics } from '../../statics/work-item-role/work-item-role-statics';

export const workItemRoleContract = z.enum(workItemRoleStatics.names);

export type WorkItemRole = z.infer<typeof workItemRoleContract>;
