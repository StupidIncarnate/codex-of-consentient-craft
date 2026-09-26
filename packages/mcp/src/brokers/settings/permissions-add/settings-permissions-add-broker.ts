/**
 * PURPOSE: Adds the dungeonmaster-managed permissions to .claude/settings.json — every MCP tool
 * grant plus the git Bash grants dispatched relay agents need — creating the file and directory
 * if needed. A settings.json that exists but fails to read (invalid JSON, EACCES) is left
 * untouched on disk and the error surfaces to the caller — this broker never treats "unreadable"
 * as "absent" and overwrites the user's other settings with a file holding only our permissions.
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
  type FileContents,
  type PathSegment,
} from '@dungeonmaster/shared/contracts';
import { join } from '#gateway/node/path';
import { readJsonFileIfExists, writeFile, ensureDir } from '#gateway/node/fs/promises';
import { mcpPermissionsCreatorTransformer } from '../../../transformers/mcp-permissions-creator/mcp-permissions-creator-transformer';
import {
  agentBrowserPermissionsStatics,
  agentGitPermissionsStatics,
  agentQaPermissionsStatics,
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
  const settingsDir = join(targetProjectRoot, locationsStatics.repoRoot.claude.dir);
  const settingsPath = join(
    targetProjectRoot,
    locationsStatics.repoRoot.claude.dir,
    locationsStatics.repoRoot.claude.settings,
  );

  // Ensure .claude directory exists
  await ensureDir(settingsDir);

  // Read existing settings, or start fresh when the file has never existed. `readJsonFileIfExists`
  // answers `null` on ENOENT only — invalid JSON and EACCES reject, and that rejection is left to
  // propagate, so a corrupt or unreadable settings.json is never mistaken for a missing one and
  // overwritten.
  const existingRaw = await readJsonFileIfExists(settingsPath);
  const existingSettings: Record<PropertyKey, unknown> =
    existingRaw === null ? {} : (existingRaw as Record<PropertyKey, unknown>);

  // Every permission dungeonmaster manages: the MCP tool grants, then the git grants that let a
  // dispatched relay agent read history, land its handoff commit and publish its round, then the
  // Claude-in-Chrome grant Siegemaster needs to drive a real browser, then the HTTP-probe grant
  // its non-UI walks read a real status and body with (a headless child has no interactive
  // approver, so an ungranted command is denied outright rather than prompted).
  const managedPermissions: ClaudePermission[] = [
    ...mcpPermissionsCreatorTransformer().map((permission) =>
      claudePermissionContract.parse(permission),
    ),
    ...agentGitPermissionsStatics.allow.map((permission) =>
      claudePermissionContract.parse(permission),
    ),
    ...agentBrowserPermissionsStatics.allow.map((permission) =>
      claudePermissionContract.parse(permission),
    ),
    ...agentQaPermissionsStatics.allow.map((permission) =>
      claudePermissionContract.parse(permission),
    ),
  ];
  const managedPermissionsSet = new Set<ClaudePermission>(managedPermissions);

  // Get existing permissions
  const existingPermissions = existingSettings.permissions as
    Record<PropertyKey, unknown> | undefined;
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

  await writeFile(settingsPath, contents);

  return contents;
};
