/**
 * PURPOSE: Builds the whole `chat-output` bus event for one line of a `spawnerType: 'command'` work
 * item, so every dispatcher that streams a command — the MCP responders and the Node loop's
 * bootstrap alike — routes through ONE construction instead of each keeping its own copy of the
 * event shape. Those copies are what let a third command role ship with a subtly different
 * processId and render its rows detached from the row they belong to.
 *
 * The processId is the WORK ITEM id, not a session id: a command work item has no sessionId to key
 * on, and the execution panel groups rows by exactly this value.
 *
 * USAGE:
 * orchestrationEventsState.emit(commandChatOutputEmitTransformer({ questId, workItemId, line }));
 * // Returns: { type, processId, payload } — the argument orchestrationEventsState.emit takes
 */

import { commandChatOutputEmitContract } from '../../contracts/command-chat-output-emit/command-chat-output-emit-contract';
import type { CommandChatOutputEmit } from '../../contracts/command-chat-output-emit/command-chat-output-emit-contract';
import type { Quest, WorkItem } from '@dungeonmaster/shared/contracts';

import { chatOutputEmitPayloadContract } from '../../contracts/chat-output-emit-payload/chat-output-emit-payload-contract';
import { commandLineToChatEntryTransformer } from '../command-line-to-chat-entry/command-line-to-chat-entry-transformer';

// A command work item runs serially, one at a time — slot 0 is the only slot it can occupy.
const COMMAND_SLOT_INDEX = 0;

export const commandChatOutputEmitTransformer = ({
  questId,
  workItemId,
  line,
}: {
  questId: Quest['id'];
  workItemId: WorkItem['id'];
  line: string;
}): CommandChatOutputEmit => {
  const chatProcessId = String(workItemId);

  return commandChatOutputEmitContract.parse({
    type: 'chat-output',
    processId: chatProcessId,
    payload: chatOutputEmitPayloadContract.parse({
      processId: chatProcessId,
      chatProcessId,
      slotIndex: COMMAND_SLOT_INDEX,
      entries: [commandLineToChatEntryTransformer({ line })],
      questId,
      workItemId,
    }),
  });
};
