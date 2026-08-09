/**
 * PURPOSE: Orchestrates starting or resuming the tavernkeeper follow-up chat session by
 * delegating to the followup-chat-start responder
 *
 * USAGE:
 * const { chatProcessId } = await FollowupChatStartFlow({ guildId, questId, message });
 * // Spawns (or resumes) the tavernkeeper Claude CLI chat process and returns the process ID
 */

import { FollowupChatStartResponder } from '../../responders/followup-chat/start/followup-chat-start-responder';

type ResponderParams = Parameters<typeof FollowupChatStartResponder>[0];
type ResponderResult = Awaited<ReturnType<typeof FollowupChatStartResponder>>;

export const FollowupChatStartFlow = async ({
  guildId,
  questId,
  message,
}: ResponderParams): Promise<ResponderResult> =>
  FollowupChatStartResponder({ guildId, questId, message });
