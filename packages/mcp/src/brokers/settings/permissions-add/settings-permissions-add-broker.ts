/**
 * PURPOSE: Adds MCP permissions to .claude/settings.json, creating the file and directory if needed
 *
 * USAGE:
 * await settingsPermissionsAddBroker({ targetProjectRoot: FilePathStub() });
 * // Creates/updates .claude/settings.json with MCP tool permissions in permissions.allow array
 */

import { fileContentsContract, type FileContents } from '@dungeonmaster/shared/contracts';
import { pathJoinAdapter } from '../../../adapters/path/join/path-join-adapter';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
import { fsMkdirAdapter } from '../../../adapters/fs/mkdir/fs-mkdir-adapter';
import { filePathContract, type FilePath } from '../../../contracts/file-path/file-path-contract';
import { mcpPermissionsCreatorTransformer } from '../../../transformers/mcp-permissions-creator/mcp-permissions-creator-transformer';
import type { McpPermission } from '../../../contracts/mcp-permission/mcp-permission-contract';

const SETTINGS_DIR = '.claude';
const SETTINGS_FILENAME = 'settings.json';
const JSON_INDENT_SPACES = 2;

export const settingsPermissionsAddBroker = async ({
  targetProjectRoot,
}: {
  targetProjectRoot: FilePath;
}): Promise<FileContents> => {
  const settingsDir = filePathContract.parse(
    pathJoinAdapter({ paths: [targetProjectRoot, SETTINGS_DIR] }),
  );
  const settingsPath = filePathContract.parse(
    pathJoinAdapter({ paths: [targetProjectRoot, SETTINGS_DIR, SETTINGS_FILENAME] }),
  );

  // Ensure .claude directory exists
  await fsMkdirAdapter({ filepath: settingsDir });

  // Read existing settings or start fresh
  let existingSettings: Record<PropertyKey, unknown> = {};
  try {
    const contents = await fsReadFileAdapter({ filepath: settingsPath });
    existingSettings = JSON.parse(contents) as Record<PropertyKey, unknown>;
  } catch {
    // File doesn't exist or is invalid JSON - will create new settings
  }

  // Get MCP permissions
  const mcpPermissions = mcpPermissionsCreatorTransformer();

  // Get existing permissions
  const existingPermissions = Reflect.get(existingSettings, 'permissions') as
    | Record<PropertyKey, unknown>
    | undefined;
  const existingAllow = (Reflect.get(existingPermissions ?? {}, 'allow') ?? []) as McpPermission[];

  // Merge permissions (deduplicate)
  const mergedAllow = [...new Set([...existingAllow, ...mcpPermissions])];

  // Update settings with merged permissions
  const updatedSettings = {
    ...existingSettings,
    permissions: {
      ...existingPermissions,
      allow: mergedAllow,
    },
  };

  const contents = fileContentsContract.parse(
    JSON.stringify(updatedSettings, null, JSON_INDENT_SPACES),
  );

  await fsWriteFileAdapter({ filepath: settingsPath, contents });

  return contents;
};
