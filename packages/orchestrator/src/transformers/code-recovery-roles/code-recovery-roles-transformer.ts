/**
 * PURPOSE: The DEFAULT failure-routing bucket — every work-item role whose `failed` (code) signal
 *   routes to a spiritmender fix + a re-run of the role (questRecoverRoleBroker), and whose
 *   `failed-replan` (plan hole) routes to a PathSeeker replan (questSplicePathseekerReplanBroker).
 *   Derived from `workItemRoleContract` by EXCLUDING the roles that route differently: the interactive
 *   spec/design roles (chaoswhisperer, glyphsmith — they talk to the user, never signal-back), the
 *   command role (ward — its terminal status is set by run-ward), the planner + sole block owner
 *   (pathseeker), the fixer itself (spiritmender — its `failed` is soft, the retry it precedes carries
 *   on), and the report-only blightwarden minions (their `failed` terminates `complete`).
 *
 *   Because it is derived by exclusion, a NEW role added to `workItemRoleContract` automatically lands
 *   in this bucket — recovery-first, never an immediate block — and the signal-back routing test's
 *   `it.each` over this list picks it up automatically.
 *
 * USAGE:
 * codeRecoveryRolesTransformer();
 * // Returns: readonly WorkItemRole[] — e.g. ['codeweaver', 'flowrider', 'siegemaster', ...]
 */

import { workItemRoleContract } from '@dungeonmaster/shared/contracts';
import type { WorkItemRole } from '@dungeonmaster/shared/contracts';

import { blightwardenMinionRolesStatics } from '../../statics/blightwarden-minion-roles/blightwarden-minion-roles-statics';

const minionRoles: readonly WorkItemRole[] = blightwardenMinionRolesStatics.roles;

export const codeRecoveryRolesTransformer = (): readonly WorkItemRole[] =>
  workItemRoleContract.options.filter(
    (role) =>
      role !== 'chaoswhisperer' &&
      role !== 'glyphsmith' &&
      role !== 'ward' &&
      role !== 'pathseeker' &&
      role !== 'spiritmender' &&
      !minionRoles.includes(role),
  );
