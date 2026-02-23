/**
 * PURPOSE: Reads a Claude session JSONL file, merges subagent entries, attaches agent IDs, and filters to user/assistant messages
 *
 * USAGE:
 * const entries = await sessionChatHistoryBroker({ sessionId, projectPath, homeDir });
 * // Returns filtered and sorted chat history entries with source tagging
 */

import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath, SessionId } from '@dungeonmaster/shared/contracts';

import { fsReadJsonlAdapter } from '../../../adapters/fs/read-jsonl/fs-read-jsonl-adapter';
import { fsReaddirAdapter } from '../../../adapters/fs/readdir/fs-readdir-adapter';
import { pathJoinAdapter } from '../../../adapters/path/join/path-join-adapter';
import { claudeProjectPathEncoderTransformer } from '../../../transformers/claude-project-path-encoder/claude-project-path-encoder-transformer';
import { stripJsonlSuffixTransformer } from '../../../transformers/strip-jsonl-suffix/strip-jsonl-suffix-transformer';
import { attachAgentIdsToEntriesTransformer } from '../../../transformers/attach-agent-ids-to-entries/attach-agent-ids-to-entries-transformer';

export const sessionChatHistoryBroker = async ({
  sessionId,
  projectPath,
  homeDir,
}: {
  sessionId: SessionId;
  projectPath: AbsoluteFilePath;
  homeDir: AbsoluteFilePath;
}): Promise<unknown[]> => {
  const jsonlPath = claudeProjectPathEncoderTransformer({
    homeDir,
    projectPath,
    sessionId,
  });

  const entries = await fsReadJsonlAdapter({ filePath: jsonlPath });

  const subagentsDir = pathJoinAdapter({
    segments: [stripJsonlSuffixTransformer({ filePath: jsonlPath }), 'subagents'],
  });
  let subagentEntries: unknown[] = [];

  try {
    const files = await fsReaddirAdapter({ dirPath: subagentsDir });
    const jsonlFiles = files.filter((f) => f.endsWith('.jsonl'));
    const subagentResults = await Promise.all(
      jsonlFiles.map(async (file) =>
        fsReadJsonlAdapter({
          filePath: absoluteFilePathContract.parse(
            pathJoinAdapter({ segments: [subagentsDir, file] }),
          ),
        }),
      ),
    );
    subagentEntries = subagentResults.flat();
  } catch {
    // subagents directory may not exist
  }

  for (const e of entries) {
    if (typeof e === 'object' && e !== null) {
      Reflect.set(e, 'source', 'session');
    }
  }
  for (const e of subagentEntries) {
    if (typeof e === 'object' && e !== null) {
      Reflect.set(e, 'source', 'subagent');
    }
  }

  attachAgentIdsToEntriesTransformer({ entries });

  const allEntries = [...entries, ...subagentEntries].sort((a, b) => {
    const tsA =
      typeof a === 'object' && a !== null && 'timestamp' in a
        ? String(Reflect.get(a, 'timestamp'))
        : '';
    const tsB =
      typeof b === 'object' && b !== null && 'timestamp' in b
        ? String(Reflect.get(b, 'timestamp'))
        : '';

    return tsA.localeCompare(tsB);
  });

  return allEntries.filter((entry: unknown) => {
    if (typeof entry !== 'object' || entry === null) {
      return false;
    }
    const type: unknown = Reflect.get(entry, 'type');
    return type === 'user' || type === 'assistant';
  });
};
