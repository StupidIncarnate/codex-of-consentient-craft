/**
 * PURPOSE: Checks if a work-item status is skipped (skipped)
 *
 * USAGE:
 * isSkippedWorkItemStatusGuard({ status: 'skipped' });
 * // Returns true only for skipped
 */

import type { WorkItemStatus } from '../../contracts/work-item-status/work-item-status-contract';
import { workItemStatusMetadataStatics } from '../../statics/work-item-status-metadata/work-item-status-metadata-statics';

export const isSkippedWorkItemStatusGuard = ({ status }: { status?: WorkItemStatus }): boolean => {
  if (status === undefined) {
    return false;
  }
  return workItemStatusMetadataStatics.statuses[status].isSkipped;
};
