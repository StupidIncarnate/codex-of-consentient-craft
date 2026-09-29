/**
 * PURPOSE: Creates real on-disk sub-agent transcript JSONL files in a temp dir for SubagentStop flow/startup integration tests, and cleans them up
 *
 * USAGE:
 * const transcripts = transcriptHarness();
 * const filePath = await transcripts.write({ contents: jsonlString });
 * // ...run the flow against filePath...
 * transcripts.cleanup();
 */
import { mkdtempSync, rmSync } from '#gateway/node/fs';
import { writeFile } from '#gateway/node/fs__promises';
import { tmpdir } from '#gateway/node/os';
import { join } from '#gateway/node/path';

import { FilePathStub } from '@dungeonmaster/shared/contracts/file-path/file-path.stub';
import type { FilePath } from '@dungeonmaster/shared/contracts';

export const transcriptHarness = (): {
  write: (params: { contents: string }) => Promise<FilePath>;
  missingPath: () => FilePath;
  cleanup: () => void;
} => {
  const createdDirs: FilePath[] = [];

  const newDir = (): FilePath => {
    const dir = FilePathStub({
      value: mkdtempSync(join(tmpdir(), 'dm-subagent-stop-')),
    });
    createdDirs.push(dir);
    return dir;
  };

  return {
    write: async ({ contents }: { contents: string }): Promise<FilePath> => {
      const filePath = FilePathStub({ value: join(newDir(), 'agent.jsonl') });
      await writeFile(filePath, contents);
      return filePath;
    },
    missingPath: (): FilePath => FilePathStub({ value: join(newDir(), 'missing.jsonl') }),
    cleanup: (): void => {
      createdDirs.forEach((dir) => {
        rmSync(dir, { recursive: true, force: true });
      });
      createdDirs.length = 0;
    },
  };
};
