/**
 * PURPOSE: Validates test guild data properties for integration testing
 *
 * USAGE:
 * testGuildContract.parse({guildPath: '/tmp/test-123', guildName: 'test-123', rootDir: '/tmp/test-123'});
 * // Returns validated TestGuildData with branded types
 */

import { z } from '#gateway/npm/zod';
import type { TestbedConfig } from '../testbed-config/testbed-config-contract';
import type { TestGuildPackageJson } from '../test-guild-package-json/test-guild-package-json-contract';
import type { ExecResult } from '@dungeonmaster/shared/contracts';
import { guildContract } from '@dungeonmaster/shared/contracts';

export const testGuildContract = z
  .object({
    guildPath: guildContract.shape.path,
    guildName: guildContract.shape.name,
    rootDir: z.string().brand<'TestGuildRootDir'>(),
  })
  .brand<'TestGuild'>();

export type TestGuildData = z.infer<typeof testGuildContract>;

export type TestGuild = TestGuildData & {
  installDungeonmaster: () => Promise<string>;
  hasCommand: ({ command }: { command: string }) => boolean;
  fileExists: ({ fileName }: { fileName: string }) => boolean;
  readFile: ({ fileName }: { fileName: string }) => string;
  writeFile: ({ fileName, content }: { fileName: string; content: string }) => void;
  deleteFile: ({ fileName }: { fileName: string }) => void;
  getConfig: () => TestbedConfig | null;
  getPackageJson: () => TestGuildPackageJson;
  getQuestFiles: ({ subdir }: { subdir?: string }) => string[];
  executeCommand: ({ command }: { command: string }) => ExecResult;
  cleanup: () => void;
};
