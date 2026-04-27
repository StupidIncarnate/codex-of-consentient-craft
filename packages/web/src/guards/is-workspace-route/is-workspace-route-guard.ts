/**
 * PURPOSE: Checks if a pathname matches either a quest route (/:guildSlug/quest[/:questId]) or a readonly session route (/:guildSlug/session/:sessionId), used for app-widget layout-mode switching.
 *
 * USAGE:
 * isWorkspaceRouteGuard({ pathname: '/my-guild/quest/abc' });
 * // Returns true when the second path segment is `quest` or `session`.
 */

import { isQuestRouteGuard } from '../is-quest-route/is-quest-route-guard';

const SESSION_SEGMENT = 'session';
const SEGMENT_INDEX = 1;
const MIN_SEGMENTS = 2;

export const isWorkspaceRouteGuard = ({ pathname }: { pathname?: string }): boolean => {
  if (!pathname) return false;
  const args = { pathname };
  if (isQuestRouteGuard(args)) return true;
  const segments = pathname.split('/').filter((segment) => segment.length > 0);
  return segments.length >= MIN_SEGMENTS && segments[SEGMENT_INDEX] === SESSION_SEGMENT;
};
