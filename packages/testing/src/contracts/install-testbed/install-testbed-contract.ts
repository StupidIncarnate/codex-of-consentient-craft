/**
 * PURPOSE: Validates install testbed data properties for integration testing the install system
 *
 * USAGE:
 * installTestbedContract.parse({guildPath: '/tmp/test-123', dungeonmasterPath: '/repo/path'});
 * // Returns validated InstallTestbedData with branded types
 */

import { z } from '#gateway/npm/zod';
import type { TestbedConfig } from '../testbed-config/testbed-config-contract';
import type { ClaudeSettings } from '../claude-settings/claude-settings-contract';
import type { McpConfig } from '../mcp-config/mcp-config-contract';

export const installTestbedContract = z
  .object({
    guildPath: z.string().brand<'InstallTestbedGuildPath'>(),
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
  getClaudeSettings: () => ClaudeSettings | null;
  getMcpConfig: () => McpConfig | null;
  getDungeonmasterConfig: () => TestbedConfig | null;
  getEslintConfig: () => string | null;
  runInitCommand: () => { exitCode: number; stdout: string; stderr: string };
};
