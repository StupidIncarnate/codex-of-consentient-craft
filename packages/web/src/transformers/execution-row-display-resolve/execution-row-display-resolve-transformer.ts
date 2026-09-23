/**
 * PURPOSE: Resolves a work item's status/role against executionStepStatusConfigStatics with a
 * neutral fallback. `stepNameContract` is deliberately open so a quest.json a newer family wrote
 * still LOADS, so a status/role this build's closed statusConfig/roleColors maps have never seen is
 * a real, reachable case — not a type-system impossibility — and indexing either map unguarded
 * throws "Cannot read properties of undefined" the moment one reaches the browser.
 *
 * USAGE:
 * executionRowDisplayResolveTransformer({status: 'in_progress', role: 'codeweaver'});
 * // Returns {statusLabel: 'RUNNING', statusColor: 'primary', roleColor: 'primary'}
 * executionRowDisplayResolveTransformer({status: 'reviewing_by_dragon' as never, role: 'codeweaver'});
 * // Returns {statusLabel: 'reviewing_by_dragon', statusColor: 'text-dim', roleColor: 'primary'}
 */

import type { DisplayLabel } from '../../contracts/display-label/display-label-contract';
import { displayLabelContract } from '../../contracts/display-label/display-label-contract';
import type { ExecutionRole } from '../../contracts/execution-role/execution-role-contract';
import type { ExecutionStepStatus } from '../../contracts/execution-step-status/execution-step-status-contract';
import type { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { executionStepStatusConfigStatics } from '../../statics/execution-step-status-config/execution-step-status-config-statics';

const FALLBACK_COLOR: keyof typeof emberDepthsThemeStatics.colors = 'text-dim';

export const executionRowDisplayResolveTransformer = ({
  status,
  role,
}: {
  status: ExecutionStepStatus;
  role: ExecutionRole;
}): {
  statusLabel: DisplayLabel;
  statusColor: keyof typeof emberDepthsThemeStatics.colors;
  roleColor: keyof typeof emberDepthsThemeStatics.colors;
} => {
  const statusConfigLookup: Partial<
    Record<
      ExecutionStepStatus,
      (typeof executionStepStatusConfigStatics.statusConfig)[keyof typeof executionStepStatusConfigStatics.statusConfig]
    >
  > = executionStepStatusConfigStatics.statusConfig;
  const statusCfg = statusConfigLookup[status] ?? { label: status, color: FALLBACK_COLOR };
  const roleColorLookup: Partial<
    Record<
      ExecutionRole,
      (typeof executionStepStatusConfigStatics.roleColors)[keyof typeof executionStepStatusConfigStatics.roleColors]
    >
  > = executionStepStatusConfigStatics.roleColors;
  const roleColor = roleColorLookup[role] ?? FALLBACK_COLOR;
  return {
    statusLabel: displayLabelContract.parse(statusCfg.label),
    statusColor: statusCfg.color,
    roleColor,
  };
};
