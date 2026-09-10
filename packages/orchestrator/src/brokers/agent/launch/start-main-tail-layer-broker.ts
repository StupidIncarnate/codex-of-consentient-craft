/**
 * PURPOSE: Layer of agentLaunchBroker — wires `chatMainSessionTailBroker` once `sessionId$` resolves so post-exit JSONL appends (background-agent task-notifications) reach the same `onEntries` consumer the streaming pipeline uses. Extracted to keep the launcher's promise chain free of inline-callback nesting and to give the tail-startup logic its own test scope.
 *
 * USAGE:
 * const stop = startMainTailLayerBroker({
 *   sessionId,
 *   cwd,
 *   processor,
 *   chatProcessId,
 *   onEntries: ({ chatProcessId, entries, sessionId }) => { },
 * });
 * // Returns the tail's stop handle so the launcher can compose teardown.
 *
 * `cwd` is the launcher's own spawn cwd, forwarded untouched: it is what names the
 * `~/.claude/projects/` directory the tailed transcript was written to.
 */

import type { ChatEntry, ProcessId, RepoRootCwd, SessionId } from '@dungeonmaster/shared/contracts';

import type { ChatLineProcessor } from '../../../contracts/chat-line-processor/chat-line-processor-contract';
import { chatMainSessionTailBroker } from '../../chat/main-session-tail/chat-main-session-tail-broker';

export const startMainTailLayerBroker = ({
  sessionId,
  cwd,
  processor,
  chatProcessId,
  onEntries,
}: {
  sessionId: SessionId;
  cwd: RepoRootCwd;
  processor: ChatLineProcessor;
  chatProcessId: ProcessId;
  onEntries: (params: {
    chatProcessId: ProcessId;
    entries: ChatEntry[];
    sessionId: SessionId | undefined;
  }) => void;
}): (() => void) => {
  const stop = chatMainSessionTailBroker({
    sessionId,
    cwd,
    processor,
    chatProcessId,
    onEntries: ({ chatProcessId: cpid, entries }): void => {
      onEntries({ chatProcessId: cpid, entries, sessionId });
    },
  });
  return stop;
};
