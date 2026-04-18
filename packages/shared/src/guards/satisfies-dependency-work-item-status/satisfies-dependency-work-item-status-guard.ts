/**
 * PURPOSE: Checks if a work-item status satisfies a downstream dependsOn dependency (complete, failed)
 *
 * USAGE:
 * satisfiesDependencyWorkItemStatusGuard({ status: 'complete' });
 * // Returns true for statuses that unblock dependents
 */

import type { WorkItemStatus } from '../../contracts/work-item-status/work-item-status-contract';
import { workItemStatusMetadataStatics } from '../../statics/work-item-status-metadata/work-item-status-metadata-statics';

export const satisfiesDependencyWorkItemStatusGuard = ({
  status,
}: {
  status?: WorkItemStatus;
}): boolean => {
  if (status === undefined) {
    return false;
  }
  return workItemStatusMetadataStatics.statuses[status].satisfiesDependency;
};
