/**
 * PURPOSE: Orchestrates replaying a finished command work item's saved output by delegating to the
 * chat-command-replay responder. Reach for this over ChatReplayFlow when the work item has no
 * Claude session — a ward, carve or commit step — so there is no JSONL to read back.
 *
 * USAGE:
 * ChatCommandReplayFlow({ questId, workItem, chatProcessId });
 * // Emits the item's output as replay chat-output, then chat-history-complete
 */

import { ChatCommandReplayResponder } from '../../responders/chat/command-replay/chat-command-replay-responder';

type ResponderParams = Parameters<typeof ChatCommandReplayResponder>[0];

export const ChatCommandReplayFlow = ({
  questId,
  workItem,
  chatProcessId,
}: ResponderParams): void => {
  ChatCommandReplayResponder({ questId, workItem, chatProcessId });
};
