/**
 * PURPOSE: Install MCP package by creating/updating .mcp.json config in target project
 *
 * USAGE:
 * const result = await StartInstall({ context });
 * // Creates .mcp.json with dungeonmaster config or merges into existing, skips if already configured
 */

import {
  type InstallContext,
  type InstallResult,
  installMessageContract,
  packageNameContract,
  fileContentsContract,
} from '@dungeonmaster/shared/contracts';
import { pathJoinAdapter } from '../adapters/path/join/path-join-adapter';
import { fsReadFileAdapter } from '../adapters/fs/read-file/fs-read-file-adapter';
import { fsWriteFileAdapter } from '../adapters/fs/write-file/fs-write-file-adapter';
import type { McpConfig } from '../contracts/mcp-config/mcp-config-contract';
import { dungeonmasterConfigCreatorTransformer } from '../transformers/dungeonmaster-config-creator/dungeonmaster-config-creator-transformer';

const CONFIG_FILENAME = '.mcp.json';
const PACKAGE_NAME = '@dungeonmaster/mcp';
const JSON_INDENT_SPACES = 2;

export const StartInstall = async ({
  context,
}: {
  context: InstallContext;
}): Promise<InstallResult> => {
  const configPath = pathJoinAdapter({
    paths: [context.targetProjectRoot, CONFIG_FILENAME],
  });

  let existingConfig: McpConfig | null = null;

  try {
    const contents = await fsReadFileAdapter({ filepath: configPath });
    existingConfig = JSON.parse(contents) as McpConfig;
  } catch {
    // File doesn't exist or is invalid JSON - will create new config
  }

  // Check if dungeonmaster is already configured
  if (existingConfig?.mcpServers && 'dungeonmaster' in existingConfig.mcpServers) {
    return {
      packageName: packageNameContract.parse(PACKAGE_NAME),
      success: true,
      action: 'skipped',
      message: installMessageContract.parse('MCP config already exists'),
    };
  }

  // Merge into existing config or create new
  if (existingConfig) {
    const mergedConfig: McpConfig = {
      ...existingConfig,
      mcpServers: {
        ...existingConfig.mcpServers,
        ...dungeonmasterConfigCreatorTransformer(),
      },
    };

    const contents = fileContentsContract.parse(
      JSON.stringify(mergedConfig, null, JSON_INDENT_SPACES),
    );

    await fsWriteFileAdapter({ filepath: configPath, contents });

    return {
      packageName: packageNameContract.parse(PACKAGE_NAME),
      success: true,
      action: 'merged',
      message: installMessageContract.parse('Merged dungeonmaster into existing .mcp.json'),
    };
  }

  // Create new config
  const newConfig: McpConfig = {
    mcpServers: dungeonmasterConfigCreatorTransformer(),
  };

  const contents = fileContentsContract.parse(JSON.stringify(newConfig, null, JSON_INDENT_SPACES));

  await fsWriteFileAdapter({ filepath: configPath, contents });

  return {
    packageName: packageNameContract.parse(PACKAGE_NAME),
    success: true,
    action: 'created',
    message: installMessageContract.parse('Created .mcp.json with dungeonmaster config'),
  };
};
