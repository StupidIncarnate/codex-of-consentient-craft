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

export const transcriptHarness = (): {
  write: (params: { contents: string }) => Promise<string>;
  missingPath: () => string;
  cleanup: () => void;
} => {
  const createdDirs: string[] = [];

  const newDir = (): string => {
    const dir = mkdtempSync(join(tmpdir(), 'dm-subagent-stop-'));
    createdDirs.push(dir);
    return dir;
  };

  return {
    write: async ({ contents }: { contents: string }): Promise<string> => {
      const filePath = join(newDir(), 'agent.jsonl');
      await writeFile(filePath, contents);
      return filePath;
    },
    missingPath: (): string => join(newDir(), 'missing.jsonl'),
    cleanup: (): void => {
      createdDirs.forEach((dir) => {
        rmSync(dir, { recursive: true, force: true });
      });
      createdDirs.length = 0;
    },
  };
};
