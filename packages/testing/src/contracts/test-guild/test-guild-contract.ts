/**
 * PURPOSE: Validates test guild data properties for integration testing
 *
 * USAGE:
 * testGuildContract.parse({guildPath: '/tmp/test-123', guildName: 'test-123', rootDir: '/tmp/test-123'});
 * // Returns validated TestGuildData with branded types
 */

import { z } from 'zod';
import type { ProcessOutput } from '../process-output/process-output-contract';
import type { CommandName } from '../command-name/command-name-contract';
import type { FileName } from '../file-name/file-name-contract';
import type { FileContent } from '../file-content/file-content-contract';
import type { DungeonmasterConfig } from '../dungeonmaster-config/dungeonmaster-config-contract';
import type { PackageJson } from '../package-json/package-json-contract';
import type { ExecResult } from '../exec-result/exec-result-contract';

export const testGuildContract = z.object({
  guildPath: z.string().brand<'GuildPath'>(),
  guildName: z.string().brand<'GuildName'>(),
  rootDir: z.string().brand<'RootDir'>(),
});

export type TestGuildData = z.infer<typeof testGuildContract>;

export type TestGuild = TestGuildData & {
  installDungeonmaster: () => ProcessOutput;
  hasCommand: ({ command }: { command: CommandName }) => boolean;
  fileExists: ({ fileName }: { fileName: FileName }) => boolean;
  readFile: ({ fileName }: { fileName: FileName }) => FileContent;
  writeFile: ({ fileName, content }: { fileName: FileName; content: FileContent }) => void;
  deleteFile: ({ fileName }: { fileName: FileName }) => void;
  getConfig: () => DungeonmasterConfig | null;
  getPackageJson: () => PackageJson;
  getQuestFiles: ({ subdir }: { subdir?: FileName }) => FileName[];
  executeCommand: ({ command }: { command: CommandName }) => ExecResult;
  cleanup: () => void;
};
