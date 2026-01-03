/**
 * PURPOSE: Validates install testbed data properties for integration testing the install system
 *
 * USAGE:
 * installTestbedContract.parse({projectPath: '/tmp/test-123', dungeonmasterPath: '/repo/path'});
 * // Returns validated InstallTestbedData with branded types
 */

import { z } from 'zod';
import type { RelativePath } from '../relative-path/relative-path-contract';
import type { FileContent } from '../file-content/file-content-contract';
import type { ExitCode } from '../exit-code/exit-code-contract';
import type { ProcessOutput } from '../process-output/process-output-contract';
import type { DungeonmasterConfig } from '../dungeonmaster-config/dungeonmaster-config-contract';

export const installTestbedContract = z.object({
  projectPath: z.string().brand<'ProjectPath'>(),
  dungeonmasterPath: z.string().brand<'DungeonmasterPath'>(),
});

export type InstallTestbedData = z.infer<typeof installTestbedContract>;

export type InstallTestbed = InstallTestbedData & {
  cleanup: () => void;
  writeFile: ({
    relativePath,
    content,
  }: {
    relativePath: RelativePath;
    content: FileContent;
  }) => void;
  readFile: ({ relativePath }: { relativePath: RelativePath }) => FileContent | null;
  getClaudeSettings: () => unknown;
  getMcpConfig: () => unknown;
  getDungeonmasterConfig: () => DungeonmasterConfig | null;
  getEslintConfig: () => FileContent | null;
  runInitCommand: () => { exitCode: ExitCode; stdout: ProcessOutput; stderr: ProcessOutput };
};
