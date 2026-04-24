/**
 * PURPOSE: Resolves a Claude-spawning work-item role to its Claude CLI model
 *
 * USAGE:
 * roleToModelTransformer({ role: workItemRoleContract.parse('pathseeker') });
 * // Returns 'opus' as ClaudeModel
 */

import type { WorkItemRole } from '@dungeonmaster/shared/contracts';

import type { ClaudeModel } from '../../contracts/claude-model/claude-model-contract';
import { roleToModelStatics } from '../../statics/role-to-model/role-to-model-statics';

type ClaudeSpawnRole = Exclude<WorkItemRole, 'ward'>;

const mapping = roleToModelStatics satisfies Record<ClaudeSpawnRole, ClaudeModel>;

export const roleToModelTransformer = ({ role }: { role: ClaudeSpawnRole }): ClaudeModel =>
  mapping[role];
