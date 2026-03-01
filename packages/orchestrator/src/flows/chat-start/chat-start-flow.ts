/**
 * PURPOSE: Orchestrates starting a chat session by delegating to the chat-start responder
 *
 * USAGE:
 * const { chatProcessId } = await ChatStartFlow({ guildId, message, sessionId });
 * // Spawns a Claude CLI chat process and returns the process ID
 */

import { ChatStartResponder } from '../../responders/chat/start/chat-start-responder';

type ResponderParams = Parameters<typeof ChatStartResponder>[0];
type ResponderResult = Awaited<ReturnType<typeof ChatStartResponder>>;

export const ChatStartFlow = async ({
  guildId,
  message,
  sessionId,
}: ResponderParams): Promise<ResponderResult> =>
  ChatStartResponder({ guildId, message, ...(sessionId && { sessionId }) });
