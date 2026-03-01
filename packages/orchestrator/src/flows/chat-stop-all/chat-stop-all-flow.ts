/**
 * PURPOSE: Orchestrates stopping all active chat processes by delegating to the chat-stop-all responder
 *
 * USAGE:
 * ChatStopAllFlow();
 * // Kills all tracked chat processes and clears the registry
 */

import { ChatStopAllResponder } from '../../responders/chat/stop-all/chat-stop-all-responder';

export const ChatStopAllFlow = (): void => {
  ChatStopAllResponder();
};
