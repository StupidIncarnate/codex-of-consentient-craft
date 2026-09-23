/**
 * PURPOSE: Resolves a work item's status/role/step against executionStepStatusConfigStatics with a
 * neutral fallback. `stepNameContract` is deliberately open so a quest.json a newer family wrote
 * still LOADS, so a status/role/step this build's closed statusConfig/roleColors/stepColors maps
 * have never seen is a real, reachable case — not a type-system impossibility — and indexing any
 * of the three maps unguarded throws "Cannot read properties of undefined" the moment one reaches
 * the browser. The STEP colour wins over the ROLE colour whenever `workItem.step` resolves one: a
 * `ward` step inside a codeweaver scope reads as the ward gate (`warning`), not as codeweaver's own
 * colour. A header or unclaimed row carries no `workItem` and falls straight through to the role
 * colour, same as an unrecognised step does.
 *
 * USAGE:
 * executionRowDisplayResolveTransformer({status: 'in_progress', role: 'codeweaver', workItem: undefined});
 * // Returns {statusLabel: 'RUNNING', statusColor: 'primary', roleColor: 'primary'}
 * executionRowDisplayResolveTransformer({status: 'in_progress', role: 'codeweaver', workItem: WorkItemStub({step: 'ward'})});
 * // Returns {statusLabel: 'RUNNING', statusColor: 'primary', roleColor: 'warning'}
 * executionRowDisplayResolveTransformer({status: 'reviewing_by_dragon' as never, role: 'codeweaver', workItem: undefined});
 * // Returns {statusLabel: 'reviewing_by_dragon', statusColor: 'text-dim', roleColor: 'primary'}
 */

import type { StepName, WorkItem } from '@dungeonmaster/shared/contracts';

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
  workItem,
}: {
  status: ExecutionStepStatus;
  role: ExecutionRole;
  workItem: WorkItem | undefined;
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
  const stepColorLookup: Partial<
    Record<
      StepName,
      (typeof executionStepStatusConfigStatics.stepColors)[keyof typeof executionStepStatusConfigStatics.stepColors]
    >
  > = executionStepStatusConfigStatics.stepColors;
  const stepColor = workItem?.step === undefined ? undefined : stepColorLookup[workItem.step];
  const roleColor = stepColor ?? roleColorLookup[role] ?? FALLBACK_COLOR;
  return {
    statusLabel: displayLabelContract.parse(statusCfg.label),
    statusColor: statusCfg.color,
    roleColor,
  };
};
