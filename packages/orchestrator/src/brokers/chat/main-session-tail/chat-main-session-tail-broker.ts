/**
 * PURPOSE: Tails the MAIN session JSONL file for lines appended AFTER the parent Claude CLI stdout closes, feeding them through the same processor used during streaming so background-agent task-notifications (written post-exit) reach the web as chat-output events
 *
 * USAGE:
 * const stop = chatMainSessionTailBroker({
 *   sessionId: SessionIdStub({ value: 'abc-123' }),
 *   cwd: RepoRootCwdStub({ value: '/home/user/my-project' }),
 *   processor: <same processor instance used during streaming>,
 *   chatProcessId: ProcessIdStub({ value: 'proc-123' }),
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

import { osUserHomedirAdapter } from '@dungeonmaster/shared/adapters';
import { claudeLineNormalizeBroker } from '@dungeonmaster/shared/brokers';
import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';
import type { ChatEntry, RepoRootCwd, SessionId } from '@dungeonmaster/shared/contracts';
import type { ProcessId } from '@dungeonmaster/shared/contracts';
import { claudeProjectPathEncoderTransformer } from '@dungeonmaster/shared/transformers';

import { fsWatchTailAdapter } from '../../../adapters/fs/watch-tail/fs-watch-tail-adapter';
import type { ChatLineProcessor } from '../../../contracts/chat-line-processor/chat-line-processor-contract';
import { chatLineSourceContract } from '../../../contracts/chat-line-source/chat-line-source-contract';

export const chatMainSessionTailBroker = ({
  sessionId,
  cwd,
  processor,
  onEntries,
  chatProcessId,
}: {
  sessionId: SessionId;
  cwd: RepoRootCwd;
  processor: ChatLineProcessor;
  onEntries: (params: { chatProcessId: ProcessId; entries: ChatEntry[] }) => void;
  chatProcessId: ProcessId;
}): (() => void) => {
  const projectPath = absoluteFilePathContract.parse(cwd);
  const homeDir = osUserHomedirAdapter();

  const jsonlPath = claudeProjectPathEncoderTransformer({
    homeDir,
    projectPath,
    sessionId,
  });

  const sessionSource = chatLineSourceContract.parse('session');

  const handle = fsWatchTailAdapter({
    filePath: jsonlPath,
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
