/**
 * PURPOSE: Picks which transcript file a PreToolUse hook should read to judge the caller that is
 * writing. `transcript_path` alone is ambiguous — it names the caller's own file only when there
 * is no `agentId`; when a sub-agent is writing, its own tool calls live in a different file, and
 * reading `transcript_path` would judge it by a parent session it never wrote to.
 *
 * USAGE:
 * transcriptResolveForHookBroker({ transcriptPath, agentId });
 * // Returns the transcript file to read, or null when none exists on disk
 */
import { fsExistsSyncAdapter } from '../../../adapters/fs/exists-sync/fs-exists-sync-adapter';
import { agentTranscriptPathTransformer } from '../../../transformers/agent-transcript-path/agent-transcript-path-transformer';
import { filePathContract } from '../../../contracts/file-path/file-path-contract';
import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

export const transcriptResolveForHookBroker = ({
  transcriptPath,
  agentId,
}: {
  transcriptPath: string;
  agentId?: string;
}): AbsoluteFilePath | null => {
  if (agentId === undefined) {
    return fsExistsSyncAdapter({ filePath: filePathContract.parse(transcriptPath) })
      ? absoluteFilePathContract.parse(transcriptPath)
      : null;
  }

  // Never fall back to transcriptPath here: for a sub-agent it is the PARENT session's file, and
  // a sub-agent's own tool calls land only in its own subagents/agent-<id>.jsonl (packages/hooks/
  // CLAUDE.md documents the same trap for SubagentStop). Returning null instead makes the caller
  // fail open rather than judge a sub-agent by a conversation it never wrote to.
  const found = agentTranscriptPathTransformer({ transcriptPath, agentId }).find((candidate) =>
    fsExistsSyncAdapter({ filePath: filePathContract.parse(String(candidate)) }),
  );
  return found === undefined ? null : found;
};
