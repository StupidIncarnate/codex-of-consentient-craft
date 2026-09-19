/**
 * PURPOSE: Creates real on-disk sub-agent transcript JSONL files in a temp dir for SubagentStop flow/startup integration tests, and cleans them up
 *
 * USAGE:
 * const transcripts = transcriptHarness();
 * const filePath = await transcripts.write({ contents: jsonlString });
 * // ...run the flow against filePath...
 * transcripts.cleanup();
 */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { FilePathStub } from '@dungeonmaster/shared/contracts';
import type { FilePath } from '@dungeonmaster/shared/contracts';

export const transcriptHarness = (): {
  write: (params: { contents: string }) => Promise<FilePath>;
  missingPath: () => FilePath;
  cleanup: () => void;
} => {
  const createdDirs: FilePath[] = [];

  const newDir = (): FilePath => {
    const dir = FilePathStub({
      value: fs.mkdtempSync(path.join(os.tmpdir(), 'dm-subagent-stop-')),
    });
    createdDirs.push(dir);
    return dir;
  };

  return {
    write: async ({ contents }: { contents: string }): Promise<FilePath> => {
      const filePath = FilePathStub({ value: path.join(newDir(), 'agent.jsonl') });
      await fs.promises.writeFile(filePath, contents);
      return filePath;
    },
    missingPath: (): FilePath => FilePathStub({ value: path.join(newDir(), 'missing.jsonl') }),
    cleanup: (): void => {
      createdDirs.forEach((dir) => {
        fs.rmSync(dir, { recursive: true, force: true });
      });
      createdDirs.length = 0;
    },
  };
};
