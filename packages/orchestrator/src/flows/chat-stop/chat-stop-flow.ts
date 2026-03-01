/**
 * PURPOSE: Orchestrates stopping a single chat process by delegating to the chat-stop responder
 *
 * USAGE:
 * const stopped = ChatStopFlow({ chatProcessId });
 * // Returns true if the process was found and killed, false otherwise
 */

import { ChatStopResponder } from '../../responders/chat/stop/chat-stop-responder';

type ResponderParams = Parameters<typeof ChatStopResponder>[0];

export const ChatStopFlow = ({ chatProcessId }: ResponderParams): boolean =>
  ChatStopResponder({ chatProcessId });
