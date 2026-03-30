/**
 * PURPOSE: Finds the sessionId of the first PathSeeker work item in a quest that has one
 *
 * USAGE:
 * questPathseekerSessionIdTransformer({ workItems });
 * // Returns SessionId of the earliest pathseeker with a session, or undefined
 */

import type { SessionId, WorkItem } from '@dungeonmaster/shared/contracts';

export const questPathseekerSessionIdTransformer = ({
  workItems,
}: {
  workItems: WorkItem[];
}): SessionId | undefined => {
  const pathseekerWithSession = workItems
    .filter((wi) => wi.role === 'pathseeker' && wi.sessionId !== undefined)
    .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));

  const [earliest] = pathseekerWithSession;
  return earliest?.sessionId;
};
