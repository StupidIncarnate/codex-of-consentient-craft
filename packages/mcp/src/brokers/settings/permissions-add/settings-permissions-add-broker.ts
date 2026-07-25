/**
 * PURPOSE: Adds the dungeonmaster-managed permissions to .claude/settings.json — every MCP tool
 * grant plus the git Bash grants dispatched relay agents need — creating the file and directory
 * if needed.
 *
 * USAGE:
 * await settingsPermissionsAddBroker({ targetProjectRoot: PathSegmentStub() });
 * // Creates/updates .claude/settings.json with the MCP tool + git permissions in permissions.allow
 *
 * Third-party entries already in `allow` are preserved verbatim. Stale dungeonmaster MCP grants
 * (tools no longer in `mcpToolsStatics.tools.names`) are pruned; `Bash(…)` entries are never
 * pruned, because this broker cannot tell which of them the user added themselves.
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
import {
  agentGitPermissionsStatics,
  locationsStatics,
  mcpToolsStatics,
} from '@dungeonmaster/shared/statics';
import { claudePermissionContract } from '../../../contracts/claude-permission/claude-permission-contract';
import type { ClaudePermission } from '../../../contracts/claude-permission/claude-permission-contract';

const JSON_INDENT_SPACES = 2;
const DUNGEONMASTER_PERMISSION_PREFIX = `mcp__${mcpToolsStatics.server.name}__`;

export const settingsPermissionsAddBroker = async ({
  targetProjectRoot,
}: {
  targetProjectRoot: PathSegment;
}): Promise<FileContents> => {
  const settingsDir = pathSegmentContract.parse(
    pathJoinAdapter({ paths: [targetProjectRoot, locationsStatics.repoRoot.claude.dir] }),
  );
  const settingsPath = pathSegmentContract.parse(
    pathJoinAdapter({
      paths: [
        targetProjectRoot,
        locationsStatics.repoRoot.claude.dir,
        locationsStatics.repoRoot.claude.settings,
      ],
    }),
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

  // Every permission dungeonmaster manages: the MCP tool grants, then the git grants that let a
  // dispatched relay agent read history and land its handoff commit (a headless child has no
  // interactive approver, so an ungranted command is denied outright rather than prompted).
  const managedPermissions: ClaudePermission[] = [
    ...mcpPermissionsCreatorTransformer().map((permission) =>
      claudePermissionContract.parse(permission),
    ),
    ...agentGitPermissionsStatics.allow.map((permission) =>
      claudePermissionContract.parse(permission),
    ),
  ];
  const managedPermissionsSet = new Set<ClaudePermission>(managedPermissions);

  // Get existing permissions
  const existingPermissions = existingSettings.permissions as
    | Record<PropertyKey, unknown>
    | undefined;
  const existingAllow = (existingPermissions?.allow ?? []) as ClaudePermission[];

  // Prune stale dungeonmaster MCP permissions (tools no longer in mcpToolsStatics.tools.names),
  // leave all other permissions untouched, then union with the current managed set.
  const prunedExisting = existingAllow.filter((permission) => {
    if (!permission.startsWith(DUNGEONMASTER_PERMISSION_PREFIX)) {
      return true;
    }
    return managedPermissionsSet.has(permission);
  });
  const mergedAllow = [...new Set<ClaudePermission>([...prunedExisting, ...managedPermissions])];

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
