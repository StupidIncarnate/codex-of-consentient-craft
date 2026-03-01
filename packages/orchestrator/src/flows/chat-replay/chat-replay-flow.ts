/**
 * PURPOSE: Orchestrates replaying chat history by delegating to the chat-replay responder
 *
 * USAGE:
 * await ChatReplayFlow({ sessionId, guildId, chatProcessId });
 * // Replays session JSONL history and emits orchestration events
 */

import { ChatReplayResponder } from '../../responders/chat/replay/chat-replay-responder';

type ResponderParams = Parameters<typeof ChatReplayResponder>[0];
type ResponderResult = Awaited<ReturnType<typeof ChatReplayResponder>>;

export const ChatReplayFlow = async ({
  sessionId,
  guildId,
  chatProcessId,
}: ResponderParams): Promise<ResponderResult> =>
  ChatReplayResponder({ sessionId, guildId, ...(chatProcessId && { chatProcessId }) });
