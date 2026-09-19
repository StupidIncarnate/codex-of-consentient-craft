/**
 * PURPOSE: Writes file contents to disk using `fs/promises`. Reach for this over
 * `@dungeonmaster/shared/adapters`, which exports `fsMkdirAdapter` but no write/rename/rm
 * counterpart — every package in this repo that writes a file (orchestrator, server, cli, mcp,
 * config, siegelense, ward) carries its own small copy of this exact adapter, and this package is
 * no exception.
 *
 * USAGE:
 * await fsWriteFileAdapter({ filePath, contents });
 * // Writes contents to filePath, utf8-encoded
 */
import { writeFile } from 'fs/promises';

import type { AdapterResult, FileContents, FilePath } from '@dungeonmaster/shared/contracts';

export const fsWriteFileAdapter = async ({
  filePath,
  contents,
}: {
  filePath: FilePath;
  contents: FileContents;
}): Promise<AdapterResult> => {
  await writeFile(filePath, contents, 'utf8');

  return { success: true as const };
};
