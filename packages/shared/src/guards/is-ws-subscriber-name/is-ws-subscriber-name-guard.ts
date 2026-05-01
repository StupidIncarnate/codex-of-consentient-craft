/**
 * PURPOSE: Returns true when a file or symbol name matches the WS subscriber naming convention
 *
 * USAGE:
 * isWsSubscriberNameGuard({ name: 'orchestrator-events-on-adapter' });
 * // Returns true — matches events-on kebab pattern
 *
 * WHEN-TO-USE: Boot-tree renderer identifying WebSocket subscriber adapters/responders that should
 * be rendered as terminal nodes with a side-channel note instead of being followed deeper.
 * Accepts both camelCase symbol names (EventsOn, OutboxWatch, Subscribe) and kebab-case file
 * basenames (events-on, outbox-watch, subscribe).
 */

export const isWsSubscriberNameGuard = ({ name }: { name?: string }): boolean => {
  if (name === undefined) return false;
  return /(?:EventsOn|events-on|[Oo]utboxWatch|outbox-watch|Subscribe|subscribe)/u.test(name);
};
