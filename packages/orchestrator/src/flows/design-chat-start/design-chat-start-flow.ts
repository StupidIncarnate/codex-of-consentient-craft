/**
 * PURPOSE: Orchestrates starting a design chat session by delegating to the design-chat-start responder
 *
 * USAGE:
 * const { chatProcessId } = await DesignChatStartFlow({ guildId, questId, message });
 * // Spawns a Claude CLI design chat process and returns the process ID
 */

import { DesignChatStartResponder } from '../../responders/design-chat/start/design-chat-start-responder';

type ResponderParams = Parameters<typeof DesignChatStartResponder>[0];
type ResponderResult = Awaited<ReturnType<typeof DesignChatStartResponder>>;

export const DesignChatStartFlow = async ({
  guildId,
  questId,
  message,
}: ResponderParams): Promise<ResponderResult> =>
  DesignChatStartResponder({ guildId, questId, message });
