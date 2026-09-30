/**
 * PURPOSE: Validates install testbed data properties for integration testing the install system
 *
 * USAGE:
 * installTestbedContract.parse({guildPath: '/tmp/test-123', dungeonmasterPath: '/repo/path'});
 * // Returns validated InstallTestbedData with branded types
 */

import { z } from '#gateway/npm/zod';
import type { TestbedConfig } from '../testbed-config/testbed-config-contract';
import type { TestbedClaudeSettings } from '../testbed-claude-settings/testbed-claude-settings-contract';
import type { TestbedMcpConfig } from '../testbed-mcp-config/testbed-mcp-config-contract';
import { guildContract } from '@dungeonmaster/shared/contracts';

export const installTestbedContract = z
  .object({
    guildPath: guildContract.shape.path,
    dungeonmasterPath: z.string().brand<'InstallTestbedDungeonmasterPath'>(),
  })
  .brand<'InstallTestbed'>();

export type InstallTestbedData = z.infer<typeof installTestbedContract>;

export type InstallTestbed = InstallTestbedData & {
  cleanup: () => void;
  writeFile: ({ relativePath, content }: { relativePath: string; content: string }) => void;
  readFile: ({ relativePath }: { relativePath: string }) => string | null;
  createSymlink: ({
    relativePath,
    targetPath,
  }: {
    relativePath: string;
    targetPath: string;
  }) => void;
  listDir: ({ relativePath }: { relativePath: string }) => readonly string[] | null;
  getClaudeSettings: () => TestbedClaudeSettings | null;
  getMcpConfig: () => TestbedMcpConfig | null;
  getDungeonmasterConfig: () => TestbedConfig | null;
  getEslintConfig: () => string | null;
  runInitCommand: () => { exitCode: number; stdout: string; stderr: string };
};
