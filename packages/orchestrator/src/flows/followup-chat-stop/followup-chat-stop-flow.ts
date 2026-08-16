/**
 * PURPOSE: Orchestrates stopping the tavernkeeper follow-up chat by delegating to the
 * followup-chat-stop responder. Reach for this over `ChatStopFlow` when the caller knows the QUEST
 * but not the chatProcessId — the browser's FOLLOW-UP tab is exactly that caller, since the process
 * it wants stopped may have been spawned before this page load.
 *
 * USAGE:
 * const { stopped } = await FollowupChatStopFlow({ questId });
 * // Kills the tavernkeeper's registered process, if one is running, and leaves its work item alone
 */

import { FollowupChatStopResponder } from '../../responders/followup-chat/stop/followup-chat-stop-responder';

type ResponderParams = Parameters<typeof FollowupChatStopResponder>[0];
type ResponderResult = Awaited<ReturnType<typeof FollowupChatStopResponder>>;

export const FollowupChatStopFlow = async ({
  questId,
}: ResponderParams): Promise<ResponderResult> => FollowupChatStopResponder({ questId });
