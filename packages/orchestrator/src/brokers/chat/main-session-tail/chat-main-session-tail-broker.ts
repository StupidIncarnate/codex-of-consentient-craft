/**
 * PURPOSE: Tails the MAIN session JSONL file for lines appended AFTER the parent Claude CLI stdout closes, feeding them through the same processor used during streaming so background-agent task-notifications (written post-exit) reach the web as chat-output events
 *
 * USAGE:
 * const stop = chatMainSessionTailBroker({
 *   sessionId: SessionIdStub({ value: 'abc-123' }),
 *   cwd: '/home/user/my-project',
 *   processor: <same processor instance used during streaming>,
 *   chatProcessId: 'proc-123',
 *   onEntries: ({ chatProcessId, entries }) => { },
 * });
 * // Returns a stop function. Call it on session teardown.
 *
 * `cwd` is the directory the tailed session was SPAWNED in, and it is required: Claude CLI names
 * the `~/.claude/projects/<encoded-cwd>/` directory from the child's own cwd, so a carved quest
 * writes its post-carve roles under the worktree's encoding and its intake conversation under the
 * repo root's. Deriving one directory per guild reaches at most one of those two groups.
 *
 * WHEN-TO-USE: After `chatSpawnBroker.onComplete` fires, to catch late appends to the main
 * session JSONL. Claude CLI writes background-agent completion notifications after the parent
 * process exits — stdout is already closed, so the tail is the only way those lines reach the
 * web during the live session.
 *
 * WHEN-NOT-TO-USE: Not for sub-agent tailing (use `chatSubagentTailBroker`). Not for replay
 * (use `chatHistoryReplayBroker` which reads the whole file).
 */

import { tailFile } from '#gateway/node/fs';
import { homedir } from '#gateway/node/os';
import { claudeLineNormalizeBroker } from '@dungeonmaster/shared/brokers';
import type { ChatEntry, Session } from '@dungeonmaster/shared/contracts';
import { claudeProjectPathEncoderTransformer } from '@dungeonmaster/shared/transformers';

import type { ChatLineProcessor } from '../../../contracts/chat-line-processor/chat-line-processor-contract';

export const chatMainSessionTailBroker = ({
  sessionId,
  cwd,
  processor,
  onEntries,
  chatProcessId,
}: {
  sessionId: Session['id'];
  cwd: string;
  processor: ChatLineProcessor;
  onEntries: (params: { chatProcessId: string; entries: ChatEntry[] }) => void;
  chatProcessId: string;
}): (() => void) => {
  const projectPath = cwd;
  const homeDir = homedir();

  const jsonlPath = claudeProjectPathEncoderTransformer({
    homeDir,
    projectPath,
    sessionId,
  });

  const sessionSource = 'session';

  const handle = tailFile({
    path: jsonlPath,
    // startPosition: 'end' — stdout already streamed every line up to this file size. We
    // only want to catch NEW appends (task-notifications written after the parent exits).
    // Reading from 0 would re-emit the whole session and duplicate what stdout already sent.
    startPosition: 'end',
    onLine: ({ line }) => {
      const parsed = claudeLineNormalizeBroker({ rawLine: line });
      const outputs = processor.processLine({
        parsed,
        source: sessionSource,
      });

      for (const output of outputs) {
        if (output.type === 'entries') {
          onEntries({ chatProcessId, entries: output.entries });
        }
      }
    },
    onError: () => {
      // Errors during tail are non-fatal; the watcher will retry on next change.
    },
  });

  return handle.stop;
};
