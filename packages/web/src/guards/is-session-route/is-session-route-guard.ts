/**
 * PURPOSE: Checks if a pathname matches a session route pattern (/:guildSlug/session or /:guildSlug/session/:sessionId), with backward compat for /quest routes
 *
 * USAGE:
 * isSessionRouteGuard({ pathname: '/my-guild/session' });
 * // Returns true if pathname has a guild slug followed by /session or /quest segment
 */

const SESSION_SEGMENT = 'session';
const QUEST_SEGMENT = 'quest';
const SEGMENT_INDEX = 1;

export const isSessionRouteGuard = ({ pathname }: { pathname?: string }): boolean => {
  if (!pathname) return false;

  const segments = pathname.split('/').filter((segment) => segment.length > 0);

  return (
    segments.length > SEGMENT_INDEX &&
    (segments[SEGMENT_INDEX] === SESSION_SEGMENT || segments[SEGMENT_INDEX] === QUEST_SEGMENT)
  );
};
