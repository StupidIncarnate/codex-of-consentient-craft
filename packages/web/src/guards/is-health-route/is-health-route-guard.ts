/**
 * PURPOSE: Checks if a pathname is the /health server-snapshot route, used to suppress
 * ServerHealthBadgeWidget in the app header on the one route that is itself the health surface.
 *
 * USAGE:
 * isHealthRouteGuard({ pathname: '/health' });
 * // Returns true for '/health' and '/health/', false otherwise.
 */

const HEALTH_PATH = '/health';

export const isHealthRouteGuard = ({ pathname }: { pathname?: string }): boolean => {
  if (!pathname) return false;
  return pathname === HEALTH_PATH || pathname === `${HEALTH_PATH}/`;
};
