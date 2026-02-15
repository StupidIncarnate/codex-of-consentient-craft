/**
 * PURPOSE: Checks if a pathname matches a quest route pattern (/:guildSlug/quest or /:guildSlug/quest/:questSlug)
 *
 * USAGE:
 * isQuestRouteGuard({ pathname: '/my-guild/quest' });
 * // Returns true if pathname has a guild slug followed by /quest segment
 */

const QUEST_SEGMENT = 'quest';
const QUEST_SEGMENT_INDEX = 1;

export const isQuestRouteGuard = ({ pathname }: { pathname?: string }): boolean => {
  if (!pathname) return false;

  const segments = pathname.split('/').filter((segment) => segment.length > 0);

  return segments.length > QUEST_SEGMENT_INDEX && segments[QUEST_SEGMENT_INDEX] === QUEST_SEGMENT;
};
