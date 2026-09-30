/**
 * PURPOSE: Validates test guild data properties for integration testing
 *
 * USAGE:
 * testGuildContract.parse({guildPath: '/tmp/test-123', guildName: 'test-123', rootDir: '/tmp/test-123'});
 * // Returns validated TestGuildData with branded types
 */

import { z } from '#gateway/npm/zod';
import type { ProcessOutput } from '../process-output/process-output-contract';
import type { TestbedConfig } from '../testbed-config/testbed-config-contract';
import type { PackageJson } from '../package-json/package-json-contract';
import type { ExecResult } from '@dungeonmaster/shared/contracts';

export const testGuildContract = z.object({
  guildPath: z.string().brand<'TestGuildGuildPath'>(),
  guildName: z.string().brand<'TestGuildGuildName'>(),
  rootDir: z.string().brand<'RootDir'>(),
});

export type TestGuildData = z.infer<typeof testGuildContract>;

export type TestGuild = TestGuildData & {
  installDungeonmaster: () => Promise<ProcessOutput>;
  hasCommand: ({ command }: { command: string }) => boolean;
  fileExists: ({ fileName }: { fileName: string }) => boolean;
  readFile: ({ fileName }: { fileName: string }) => string;
  writeFile: ({ fileName, content }: { fileName: string; content: string }) => void;
  deleteFile: ({ fileName }: { fileName: string }) => void;
  getConfig: () => TestbedConfig | null;
  getPackageJson: () => PackageJson;
  getQuestFiles: ({ subdir }: { subdir?: string }) => string[];
  executeCommand: ({ command }: { command: string }) => ExecResult;
  cleanup: () => void;
};
