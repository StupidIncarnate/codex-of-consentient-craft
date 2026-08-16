/**
 * PURPOSE: Decides whether a completion frame belongs to the turn a composer is tracking. Reach for
 * this rather than comparing the two ids inline: `useQuestChatBinding` tracks TWO independent turns
 * — the main composer's and the FOLLOW-UP tab's tavernkeeper — and the rule has three arms that are
 * easy to get subtly different at each call site.
 *
 * The two permissive arms are the load-bearing ones. An absent tracked id means "armed with no
 * handle yet" — the first message, which must create its quest before there is a questId to POST
 * to, and the sub-second window between committing a turn and its POST resolving. An untagged
 * payload is a frame the wire never named a process on. Both fall through to a match, which is what
 * keeps a turn that emits nothing from holding STOP forever; the strict arm is what stops a SIBLING
 * work item's completion from reporting this composer's in-flight turn as idle.
 *
 * USAGE:
 * isTrackedChatProcessGuard({ chatProcessId: payload.chatProcessId, trackedChatProcessId: ref.current });
 */

import type { ProcessId } from '@dungeonmaster/shared/contracts';

export const isTrackedChatProcessGuard = ({
  chatProcessId,
  trackedChatProcessId,
}: {
  chatProcessId?: ProcessId | undefined;
  trackedChatProcessId?: ProcessId | null | undefined;
}): boolean =>
  trackedChatProcessId === null ||
  trackedChatProcessId === undefined ||
  chatProcessId === undefined ||
  chatProcessId === trackedChatProcessId;
