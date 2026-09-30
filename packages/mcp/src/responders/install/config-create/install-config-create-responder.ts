/**
 * PURPOSE: Reads/creates .mcp.json config and adds MCP permissions to .claude/settings.json. A
 * corrupt or unreadable .mcp.json throws instead of being treated as absent — collapsing the two
 * is the bug that overwrote every other MCP server the user had configured with a fresh file
 * holding only dungeonmaster's own entry.
 *
 * USAGE:
 * const result = await InstallConfigCreateResponder({ context });
 * // Creates .mcp.json with dungeonmaster config, adds MCP permissions to .claude/settings.json
 */

import {
  type InstallContext,
  type InstallResult,
  installMessageContract,
  packageNameContract,
} from '@dungeonmaster/shared/contracts';
import { jsonFileContentsTransformer } from '@dungeonmaster/shared/transformers';
import { join } from '#gateway/node/path';
import { readJsonFileIfExists, writeFile } from '#gateway/node/fs__promises';
import { mcpConfigContract } from '../../../contracts/mcp-config/mcp-config-contract';
import type { McpConfig } from '../../../contracts/mcp-config/mcp-config-contract';
import { dungeonmasterConfigCreatorTransformer } from '../../../transformers/dungeonmaster-config-creator/dungeonmaster-config-creator-transformer';
import { settingsPermissionsAddBroker } from '../../../brokers/settings/permissions-add/settings-permissions-add-broker';
import { agentsPluginCreateBroker } from '../../../brokers/agents/plugin-create/agents-plugin-create-broker';
import { locationsStatics } from '@dungeonmaster/shared/statics';

const PACKAGE_NAME = '@dungeonmaster/mcp';

export const InstallConfigCreateResponder = async ({
  context,
}: {
  context: InstallContext;
}): Promise<InstallResult> => {
  const configPath = join(context.targetProjectRoot, locationsStatics.repoRoot.mcpJson);

  // Rejects (invalid JSON, EACCES, …) propagate to installExecuteBroker, which reports them as a
  // failed InstallResult naming this file — never treated as "missing", which used to fall through
  // to the write below and silently drop every other MCP server the user configured.
  const existingContents = await readJsonFileIfExists(configPath);
  const existingConfig: McpConfig | null =
    existingContents === null ? null : mcpConfigContract.parse(existingContents);

  // Add MCP permissions to .claude/settings.json (always, regardless of MCP config state)
  const targetProjectRoot = context.targetProjectRoot;
  await settingsPermissionsAddBroker({ targetProjectRoot });
  await agentsPluginCreateBroker({ targetProjectRoot });

  // Check if dungeonmaster is already configured
  if (existingConfig?.mcpServers && 'dungeonmaster' in existingConfig.mcpServers) {
    return {
      packageName: packageNameContract.parse(PACKAGE_NAME),
      success: true,
      action: 'skipped',
      message: installMessageContract.parse('MCP config already exists, added permissions'),
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

    const contents = jsonFileContentsTransformer({ value: mergedConfig });

    await writeFile(configPath, contents);

    return {
      packageName: packageNameContract.parse(PACKAGE_NAME),
      success: true,
      action: 'merged',
      message: installMessageContract.parse(
        'Merged dungeonmaster into existing .mcp.json and added permissions',
      ),
    };
  }

  // Create new config
  const newConfig: McpConfig = {
    mcpServers: dungeonmasterConfigCreatorTransformer(),
  };

  const contents = jsonFileContentsTransformer({ value: newConfig });

  await writeFile(configPath, contents);

  return {
    packageName: packageNameContract.parse(PACKAGE_NAME),
    success: true,
    action: 'created',
    message: installMessageContract.parse(
      'Created .mcp.json with dungeonmaster config and added permissions',
    ),
  };
};
