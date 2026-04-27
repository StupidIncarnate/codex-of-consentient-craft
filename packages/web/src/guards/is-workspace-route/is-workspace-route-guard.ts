/**
 * PURPOSE: Checks if a pathname matches either a quest route or a session route, used for app-widget layout-mode switching
 *
 * USAGE:
 * isWorkspaceRouteGuard({ pathname: '/my-guild/quest/abc' });
 * // Returns true when isQuestRouteGuard OR isSessionRouteGuard matches
 */

import { isQuestRouteGuard } from '../is-quest-route/is-quest-route-guard';
import { isSessionRouteGuard } from '../is-session-route/is-session-route-guard';

export const isWorkspaceRouteGuard = ({ pathname }: { pathname?: string }): boolean => {
  const args = pathname === undefined ? {} : { pathname };
  return isQuestRouteGuard(args) || isSessionRouteGuard(args);
};
