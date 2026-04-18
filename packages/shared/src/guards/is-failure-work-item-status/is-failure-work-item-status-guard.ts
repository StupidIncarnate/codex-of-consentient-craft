/**
 * PURPOSE: Checks if a work-item status is a failure (failed)
 *
 * USAGE:
 * isFailureWorkItemStatusGuard({ status: 'failed' });
 * // Returns true only for failed
 */

import type { WorkItemStatus } from '../../contracts/work-item-status/work-item-status-contract';
import { workItemStatusMetadataStatics } from '../../statics/work-item-status-metadata/work-item-status-metadata-statics';

export const isFailureWorkItemStatusGuard = ({ status }: { status?: WorkItemStatus }): boolean => {
  if (status === undefined) {
    return false;
  }
  return workItemStatusMetadataStatics.statuses[status].isFailure;
};
