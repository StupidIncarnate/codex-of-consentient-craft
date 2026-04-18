/**
 * PURPOSE: Checks if a work-item status is pending (pending)
 *
 * USAGE:
 * isPendingWorkItemStatusGuard({ status: 'pending' });
 * // Returns true only for pending
 */

import type { WorkItemStatus } from '../../contracts/work-item-status/work-item-status-contract';
import { workItemStatusMetadataStatics } from '../../statics/work-item-status-metadata/work-item-status-metadata-statics';

export const isPendingWorkItemStatusGuard = ({ status }: { status?: WorkItemStatus }): boolean => {
  if (status === undefined) {
    return false;
  }
  return workItemStatusMetadataStatics.statuses[status].isPending;
};
