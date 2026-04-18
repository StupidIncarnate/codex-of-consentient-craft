/**
 * PURPOSE: Checks if a work-item status is terminal (complete, failed, skipped)
 *
 * USAGE:
 * isTerminalWorkItemStatusGuard({ status: 'complete' });
 * // Returns true for statuses where the work item will no longer run
 */

import type { WorkItemStatus } from '../../contracts/work-item-status/work-item-status-contract';
import { workItemStatusMetadataStatics } from '../../statics/work-item-status-metadata/work-item-status-metadata-statics';

export const isTerminalWorkItemStatusGuard = ({ status }: { status?: WorkItemStatus }): boolean => {
  if (status === undefined) {
    return false;
  }
  return workItemStatusMetadataStatics.statuses[status].isTerminal;
};
