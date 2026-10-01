/**
 * PURPOSE: Builds the whole LIVE `chat-output` bus event for one chunk of a `spawnerType: 'command'`
 * work item's output, so every dispatcher that streams a command routes through ONE construction
 * instead of each keeping its own copy of the event shape. Those copies are what let a third
 * command role ship with a subtly different processId and render its rows detached from the row
 * they belong to. Its entries come from `commandOutputToChatEntriesTransformer`, the funnel the
 * replay of a finished command shares, so a row reads the same live and after a reload.
 *
 * The processId is the WORK ITEM id, not a session id: a command work item has no sessionId to key
 * on, and the execution panel groups rows by exactly this value.
 *
 * USAGE:
 * const event = commandChatOutputEmitTransformer({ questId, workItemId, text });
 * // Returns: { type, processId, payload } — payload.entries is empty for a chunk of nothing but
 * // terminal redraw codes, and the caller emits nothing for it
 */

import { commandChatOutputEmitContract } from '../../contracts/command-chat-output-emit/command-chat-output-emit-contract';
import type { CommandChatOutputEmit } from '../../contracts/command-chat-output-emit/command-chat-output-emit-contract';
import type { Quest, WorkItem } from '@dungeonmaster/shared/contracts';

import { chatOutputEmitPayloadContract } from '../../contracts/chat-output-emit-payload/chat-output-emit-payload-contract';
import { commandOutputToChatEntriesTransformer } from '../command-output-to-chat-entries/command-output-to-chat-entries-transformer';

// A command work item runs serially, one at a time — slot 0 is the only slot it can occupy.
const COMMAND_SLOT_INDEX = 0;

export const commandChatOutputEmitTransformer = ({
  questId,
  workItemId,
  text,
}: {
  questId: Quest['id'];
  workItemId: WorkItem['id'];
  text: string;
}): CommandChatOutputEmit => {
  const chatProcessId = String(workItemId);

  return commandChatOutputEmitContract.parse({
    type: 'chat-output',
    processId: chatProcessId,
    payload: chatOutputEmitPayloadContract.parse({
      processId: chatProcessId,
      chatProcessId,
      slotIndex: COMMAND_SLOT_INDEX,
      entries: commandOutputToChatEntriesTransformer({ text }),
      questId,
      workItemId,
    }),
  });
};
