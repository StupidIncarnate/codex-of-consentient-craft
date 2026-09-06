/**
 * PURPOSE: Decides whether a completion frame belongs to the turn a composer is tracking. Reach for
 * this rather than comparing the two ids inline: `useQuestChatBinding` tracks TWO independent turns
 * — the main composer's and the FOLLOW-UP tab's tavernkeeper — and the rule has four arms that are
 * easy to get subtly different at each call site.
 *
 * The two permissive arms are the load-bearing ones. An absent tracked id means "armed with no
 * handle yet" — the sub-second window between committing a turn and its POST resolving. An untagged
 * payload is a frame the wire never named a process on. Both fall through to a match, which is what
 * keeps a turn that emits nothing from holding STOP forever; the strict arm is what stops a SIBLING
 * work item's completion from reporting this composer's in-flight turn as idle.
 *
 * A RETAINED frame gets neither permissive arm. It is a turn that ended before this browser was
 * listening, re-sent to it at the end of a `subscribe-quest`, so it says nothing at all about
 * whatever turn is in flight NOW — and the "armed with no handle yet" arm is precisely the state a
 * just-committed turn is in while its POST is still open. Only an id-to-id match counts there.
 *
 * USAGE:
 * isTrackedChatProcessGuard({ chatProcessId: payload.chatProcessId, trackedChatProcessId: ref.current, retained: payload.retained });
 */

import type { ProcessId } from '@dungeonmaster/shared/contracts';

export const isTrackedChatProcessGuard = ({
  chatProcessId,
  trackedChatProcessId,
  retained,
}: {
  chatProcessId?: ProcessId | undefined;
  trackedChatProcessId?: ProcessId | null | undefined;
  retained?: boolean | undefined;
}): boolean => {
  if (retained === true) {
    return chatProcessId !== undefined && chatProcessId === trackedChatProcessId;
  }
  return (
    trackedChatProcessId === null ||
    trackedChatProcessId === undefined ||
    chatProcessId === undefined ||
    chatProcessId === trackedChatProcessId
  );
};
