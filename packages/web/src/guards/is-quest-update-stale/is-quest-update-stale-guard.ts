/**
 * PURPOSE: Decides whether an inbound quest-modified frame is safe to apply over the frame already
 * applied for the same quest. `questContract` carries no sequence number, only an optional
 * `updatedAt`, so this is the one signal available to tell a delayed duplicate broadcast or a
 * reconnect-replay race apart from a genuine later update — without it, a binding applying every
 * inbound frame unconditionally lets an out-of-order frame un-freeze a work item's completed
 * duration back to a live one.
 *
 * Fails OPEN, not closed, and that default is load-bearing. `updatedAt` is stamped by convention,
 * not by contract: `questOperationsUpdateBroker` and `questModifyBroker` both stamp it
 * unconditionally on every mutation, but the stamp is a copy-pasted `new Date().toISOString()`
 * across half a dozen independent broker files with no schema default and no lint rule behind it —
 * and `questCreateBroker` persists the very first `quest.json` with NO `updatedAt` at all. Nothing
 * stops a future write path from omitting it the same way. Given that, dropping every undated frame
 * would risk freezing a row's figure PERMANENTLY the day one path skips the stamp — a failure a user
 * cannot see and that never self-corrects. Letting an undated frame through costs nothing an undated
 * frame ever bought: it was unrankable either way, and a stale one that slips through is corrected by
 * the next real update. So this only ever drops a frame it can POSITIVELY prove is older — both
 * timestamps present, incoming strictly less than applied. Missing either side, or an exact tie,
 * applies the frame.
 *
 * USAGE:
 * isQuestUpdateStaleGuard({ incomingUpdatedAt: quest.updatedAt, lastAppliedUpdatedAt: ref.current });
 * // true => drop the frame; false => apply it and remember its updatedAt as the new baseline
 */

import type { Quest } from '@dungeonmaster/shared/contracts';

export const isQuestUpdateStaleGuard = ({
  incomingUpdatedAt,
  lastAppliedUpdatedAt,
}: {
  incomingUpdatedAt?: Quest['updatedAt'];
  lastAppliedUpdatedAt?: Quest['updatedAt'];
}): boolean => {
  if (incomingUpdatedAt === undefined || lastAppliedUpdatedAt === undefined) return false;
  return incomingUpdatedAt < lastAppliedUpdatedAt;
};
