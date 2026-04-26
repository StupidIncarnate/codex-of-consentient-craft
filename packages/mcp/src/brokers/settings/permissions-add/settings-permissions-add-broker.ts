/**
 * PURPOSE: Adds MCP permissions to .claude/settings.json, creating the file and directory if needed
 *
 * USAGE:
 * await settingsPermissionsAddBroker({ targetProjectRoot: PathSegmentStub() });
 * // Creates/updates .claude/settings.json with MCP tool permissions in permissions.allow array
 */

import {
  fileContentsContract,
  pathSegmentContract,
  type FileContents,
  type PathSegment,
} from '@dungeonmaster/shared/contracts';
import { pathJoinAdapter } from '../../../adapters/path/join/path-join-adapter';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
import { fsMkdirAdapter } from '../../../adapters/fs/mkdir/fs-mkdir-adapter';
import { mcpPermissionsCreatorTransformer } from '../../../transformers/mcp-permissions-creator/mcp-permissions-creator-transformer';
import { mcpToolsStatics } from '@dungeonmaster/shared/statics';
import type { McpPermission } from '../../../contracts/mcp-permission/mcp-permission-contract';

const SETTINGS_DIR = '.claude';
const SETTINGS_FILENAME = 'settings.json';
const JSON_INDENT_SPACES = 2;
const DUNGEONMASTER_PERMISSION_PREFIX = `mcp__${mcpToolsStatics.server.name}__`;

export const settingsPermissionsAddBroker = async ({
  targetProjectRoot,
}: {
  targetProjectRoot: PathSegment;
}): Promise<FileContents> => {
  const settingsDir = pathSegmentContract.parse(
    pathJoinAdapter({ paths: [targetProjectRoot, SETTINGS_DIR] }),
  );
  const settingsPath = pathSegmentContract.parse(
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

  // Get current valid MCP permissions
  const mcpPermissions = mcpPermissionsCreatorTransformer();
  const currentPermissionsSet = new Set<McpPermission>(mcpPermissions);

  // Get existing permissions
  const existingPermissions = existingSettings.permissions as
    | Record<PropertyKey, unknown>
    | undefined;
  const existingAllow = (existingPermissions?.allow ?? []) as McpPermission[];

  // Prune stale dungeonmaster permissions (tools no longer in mcpToolsStatics.tools.names),
  // leave all other permissions untouched, then union with current dungeonmaster permissions.
  const prunedExisting = existingAllow.filter((permission) => {
    if (!permission.startsWith(DUNGEONMASTER_PERMISSION_PREFIX)) {
      return true;
    }
    return currentPermissionsSet.has(permission);
  });
  const mergedAllow = [...new Set<McpPermission>([...prunedExisting, ...mcpPermissions])];

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
