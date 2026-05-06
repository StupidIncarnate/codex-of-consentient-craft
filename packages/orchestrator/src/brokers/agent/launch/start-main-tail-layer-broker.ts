/**
 * PURPOSE: Layer of agentLaunchBroker — wires `chatMainSessionTailBroker` once `sessionId$` resolves so post-exit JSONL appends (background-agent task-notifications) reach the same `onEntries` consumer the streaming pipeline uses. Extracted to keep the launcher's promise chain free of inline-callback nesting and to give the tail-startup logic its own test scope.
 *
 * USAGE:
 * const stop = await startMainTailLayerBroker({
 *   sessionId,
 *   guildId,
 *   processor,
 *   chatProcessId,
 *   onEntries: ({ chatProcessId, entries, sessionId }) => { },
 * });
 * // Returns the tail's stop handle so the launcher can compose teardown.
 */

import type { ChatEntry, GuildId, ProcessId, SessionId } from '@dungeonmaster/shared/contracts';

import type { ChatLineProcessor } from '../../../contracts/chat-line-processor/chat-line-processor-contract';
import { chatMainSessionTailBroker } from '../../chat/main-session-tail/chat-main-session-tail-broker';

export const startMainTailLayerBroker = async ({
  sessionId,
  guildId,
  processor,
  chatProcessId,
  onEntries,
}: {
  sessionId: SessionId;
  guildId: GuildId;
  processor: ChatLineProcessor;
  chatProcessId: ProcessId;
  onEntries: (params: {
    chatProcessId: ProcessId;
    entries: ChatEntry[];
    sessionId: SessionId | undefined;
  }) => void;
}): Promise<() => void> => {
  const stop = await chatMainSessionTailBroker({
    sessionId,
    guildId,
    processor,
    chatProcessId,
    onEntries: ({ chatProcessId: cpid, entries }): void => {
      onEntries({ chatProcessId: cpid, entries, sessionId });
    },
  });
  return stop;
};
