/**
 * PURPOSE: Wraps fs.stat to retrieve file modification time, used by the Claude Code session resolver to pick the most-recently-modified JSONL file in ~/.claude/projects/<encoded-cwd>/
 *
 * USAGE:
 * const stats = await fsStatAdapter({ filepath: PathSegmentStub({ value: '/path/to/file.jsonl' }) });
 * // Returns Stats object with mtimeMs
 */

import { stat } from 'fs/promises';
import type { Stats } from 'fs';
import type { PathSegment } from '@dungeonmaster/shared/contracts';

export const fsStatAdapter = async ({ filepath }: { filepath: PathSegment }): Promise<Stats> =>
  stat(filepath);
