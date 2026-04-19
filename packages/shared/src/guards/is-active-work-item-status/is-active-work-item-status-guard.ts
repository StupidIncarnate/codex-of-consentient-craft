/**
 * PURPOSE: Checks if a work-item status indicates the item is currently running (in_progress)
 *
 * USAGE:
 * isActiveWorkItemStatusGuard({ status: 'in_progress' });
 * // Returns true only for in_progress
 */

import type { WorkItemStatus } from '../../contracts/work-item-status/work-item-status-contract';
import { workItemStatusMetadataStatics } from '../../statics/work-item-status-metadata/work-item-status-metadata-statics';

export const isActiveWorkItemStatusGuard = ({ status }: { status?: WorkItemStatus }): boolean => {
  if (status === undefined) {
    return false;
  }
  return workItemStatusMetadataStatics.statuses[status].isActive;
};
