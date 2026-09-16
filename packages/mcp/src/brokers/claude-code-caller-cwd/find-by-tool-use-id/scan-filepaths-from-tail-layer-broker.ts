/**
 * PURPOSE: Layer of claudeCodeCallerCwdFindByToolUseIdBroker — visits a newest-mtime-first list
 * of JSONL filepaths SEQUENTIALLY, reading each one fully and scanning its lines from the TAIL
 * backwards, and stops at the first line whose `tool_use.id` matches. The call being resolved
 * happened seconds ago, so its line sits near the end of the most-recently-written file — reading
 * files in mtime order and lines back-to-front turns a full-directory scan into a one-file,
 * few-line check in the common case, without changing the worst case (a genuinely old or missing
 * toolUseId still walks every file). Returns the matched file's CURRENT length alongside its cwd
 * so the caller can seed a fresh callerCwdScanCursorState entry — the warm path that lets the
 * NEXT lookup in this same file read only the bytes appended since this one.
 *
 * USAGE:
 * const hit = await scanFilepathsFromTailLayerBroker({ filepaths, toolUseIdString, toolUseIdToken });
 * // hit is { cwd, cursor: { filepath, offsetBytes } } for the matching file, or undefined
 */

import { absoluteFilePathContract, pathSegmentContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { claudeCodeToolUseScanLineContract } from '../../../contracts/claude-code-tool-use-scan-line/claude-code-tool-use-scan-line-contract';
import { callerCwdScanCursorContract } from '../../../contracts/caller-cwd-scan-cursor/caller-cwd-scan-cursor-contract';
import type { CallerCwdScanCursor } from '../../../contracts/caller-cwd-scan-cursor/caller-cwd-scan-cursor-contract';

const TOOL_USE_TYPE_TOKEN = '"type":"tool_use"';

export const scanFilepathsFromTailLayerBroker = async ({
  filepaths,
  toolUseIdString,
  toolUseIdToken,
}: {
  filepaths: readonly string[];
  toolUseIdString: string;
  toolUseIdToken: string;
}): Promise<{ cwd: AbsoluteFilePath; cursor: CallerCwdScanCursor } | undefined> => {
  const [filepath, ...restFilepaths] = filepaths;
  if (filepath === undefined) {
    return undefined;
  }

  try {
    const contents = String(
      await fsReadFileAdapter({ filepath: pathSegmentContract.parse(filepath) }),
    );
    if (contents.includes(toolUseIdToken)) {
      const lines = contents.split('\n');
      for (let index = lines.length - 1; index >= 0; index -= 1) {
        const line = lines[index];
        if (line === undefined || line.length === 0) continue;
        if (!line.includes(TOOL_USE_TYPE_TOKEN)) continue;
        if (!line.includes(toolUseIdToken)) continue;
        const parsed = claudeCodeToolUseScanLineContract.safeParse(JSON.parse(line));
        if (!parsed.success) continue;
        const content = parsed.data.message?.content ?? [];
        const hit = content.some(
          (item) => String(item.type) === 'tool_use' && String(item.id) === toolUseIdString,
        );
        if (hit && parsed.data.cwd !== undefined) {
          return {
            cwd: absoluteFilePathContract.parse(parsed.data.cwd),
            cursor: callerCwdScanCursorContract.parse({
              filepath: absoluteFilePathContract.parse(filepath),
              offsetBytes: contents.length,
            }),
          };
        }
      }
    }
  } catch {
    // Unreadable or malformed — fall through to the next candidate file.
  }

  return scanFilepathsFromTailLayerBroker({
    filepaths: restFilepaths,
    toolUseIdString,
    toolUseIdToken,
  });
};
