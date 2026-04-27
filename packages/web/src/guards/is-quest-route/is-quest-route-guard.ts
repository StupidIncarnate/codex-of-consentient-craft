/**
 * PURPOSE: Checks if a pathname matches a quest route pattern (/:guildSlug/quest or /:guildSlug/quest/:questId)
 *
 * USAGE:
 * isQuestRouteGuard({ pathname: '/my-guild/quest' });
 * // Returns true if pathname has a guild slug followed by /quest, with an optional questId segment
 */

const QUEST_SEGMENT = 'quest';
const SEGMENT_INDEX = 1;
const MIN_SEGMENTS = 2;

export const isQuestRouteGuard = ({ pathname }: { pathname?: string }): boolean => {
  if (!pathname) return false;

  const segments = pathname.split('/').filter((segment) => segment.length > 0);

  return segments.length >= MIN_SEGMENTS && segments[SEGMENT_INDEX] === QUEST_SEGMENT;
};
