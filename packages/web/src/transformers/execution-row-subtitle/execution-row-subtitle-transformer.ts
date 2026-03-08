/**
 * PURPOSE: Builds the subtitle text for an execution row based on status, dependencies, and files
 *
 * USAGE:
 * executionRowSubtitleTransformer({status, dependsOn, files});
 * // Returns "└─ depends on: step-1, step-2" or "└─ src/auth.ts"
 */

import type { DependencyLabel } from '../../contracts/dependency-label/dependency-label-contract';
import type { DisplayFilePath } from '../../contracts/display-file-path/display-file-path-contract';
import type { DisplayLabel } from '../../contracts/display-label/display-label-contract';
import { displayLabelContract } from '../../contracts/display-label/display-label-contract';
import type { ExecutionStepStatus } from '../../contracts/execution-step-status/execution-step-status-contract';

export const executionRowSubtitleTransformer = ({
  status,
  dependsOn,
  files,
}: {
  status: ExecutionStepStatus;
  dependsOn: DependencyLabel[];
  files: DisplayFilePath[];
}): DisplayLabel => {
  if (status === 'queued' && dependsOn.length > 0) {
    return displayLabelContract.parse(
      `\u2514\u2500 waiting for slot (depends on: ${dependsOn.join(', ')})`,
    );
  }
  if (status === 'pending' && dependsOn.length > 0) {
    return displayLabelContract.parse(`\u2514\u2500 depends on: ${dependsOn.join(', ')}`);
  }
  if (files.length > 0) {
    return displayLabelContract.parse(`\u2514\u2500 ${files.join(', ')}`);
  }
  return displayLabelContract.parse('');
};
