/**
 * PURPOSE: Checks if a work-item status is complete (complete)
 *
 * USAGE:
 * isCompleteWorkItemStatusGuard({ status: 'complete' });
 * // Returns true only for complete
 */

import type { WorkItemStatus } from '../../contracts/work-item-status/work-item-status-contract';
import { workItemStatusMetadataStatics } from '../../statics/work-item-status-metadata/work-item-status-metadata-statics';

export const isCompleteWorkItemStatusGuard = ({ status }: { status?: WorkItemStatus }): boolean => {
  if (status === undefined) {
    return false;
  }
  return workItemStatusMetadataStatics.statuses[status].isComplete;
};
