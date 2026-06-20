/**
 * PURPOSE: Creates or merges dungeonmaster hooks into .claude/settings.json for a target project.
 * Re-runs are idempotent and additive: any prior dungeonmaster-* hook entries are stripped before the freshly-generated set is appended, so newly-added hook types (e.g. a new PostToolUse) land on every subsequent `dungeonmaster init` without manual cleanup.
 *
 * USAGE:
 * const result = await InstallCreateSettingsResponder({ context });
 * // 'created' on fresh project, 'merged' on existing settings (preserves third-party entries).
 */

import {
  type InstallContext,
  type InstallResult,
  installMessageContract,
  packageNameContract,
  fileContentsContract,
} from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { pathJoinAdapter } from '../../../adapters/path/join/path-join-adapter';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
import type { ClaudeSettings } from '../../../contracts/claude-settings/claude-settings-contract';
import { dungeonmasterHooksCreatorTransformer } from '../../../transformers/dungeonmaster-hooks-creator/dungeonmaster-hooks-creator-transformer';
import { upsertDungeonmasterHookListTransformer } from '../../../transformers/upsert-dungeonmaster-hook-list/upsert-dungeonmaster-hook-list-transformer';

const PACKAGE_NAME = '@dungeonmaster/hooks';
const JSON_INDENT_SPACES = 2;

export const InstallCreateSettingsResponder = async ({
  context,
}: {
  context: InstallContext;
}): Promise<InstallResult> => {
  const settingsPath = pathJoinAdapter({
    paths: [
      context.targetProjectRoot,
      locationsStatics.repoRoot.claude.dir,
      locationsStatics.repoRoot.claude.settings,
    ],
  });

  const existingSettings: ClaudeSettings | null = await fsReadFileAdapter({
    filePath: settingsPath,
  })
    .then((contents) => JSON.parse(contents) as ClaudeSettings)
    .catch(() => null);

  const dungeonmasterHooks = dungeonmasterHooksCreatorTransformer();

  if (existingSettings) {
    const existingHooks = existingSettings.hooks ?? {};

    const mergedSettings: ClaudeSettings = {
      ...existingSettings,
      hooks: {
        ...existingHooks,
        PreToolUse: upsertDungeonmasterHookListTransformer({
          existing: existingHooks.PreToolUse ?? [],
          fresh: dungeonmasterHooks.PreToolUse,
        }),
        PostToolUse: upsertDungeonmasterHookListTransformer({
          existing: existingHooks.PostToolUse ?? [],
          fresh: dungeonmasterHooks.PostToolUse,
        }),
        SessionStart: upsertDungeonmasterHookListTransformer({
          existing: existingHooks.SessionStart ?? [],
          fresh: dungeonmasterHooks.SessionStart,
        }),
        SubagentStart: upsertDungeonmasterHookListTransformer({
          existing: existingHooks.SubagentStart ?? [],
          fresh: dungeonmasterHooks.SubagentStart,
        }),
        SubagentStop: upsertDungeonmasterHookListTransformer({
          existing: existingHooks.SubagentStop ?? [],
          fresh: dungeonmasterHooks.SubagentStop,
        }),
        WorktreeCreate: upsertDungeonmasterHookListTransformer({
          existing: existingHooks.WorktreeCreate ?? [],
          fresh: dungeonmasterHooks.WorktreeCreate,
        }),
      },
    };

    const contents = fileContentsContract.parse(
      JSON.stringify(mergedSettings, null, JSON_INDENT_SPACES),
    );

    await fsWriteFileAdapter({ filepath: settingsPath, contents });

    return {
      packageName: packageNameContract.parse(PACKAGE_NAME),
      success: true,
      action: 'merged',
      message: installMessageContract.parse('Merged hooks into existing settings'),
    };
  }

  const newSettings: ClaudeSettings = {
    hooks: dungeonmasterHooks,
  };

  const contents = fileContentsContract.parse(
    JSON.stringify(newSettings, null, JSON_INDENT_SPACES),
  );

  await fsWriteFileAdapter({ filepath: settingsPath, contents });

  return {
    packageName: packageNameContract.parse(PACKAGE_NAME),
    success: true,
    action: 'created',
    message: installMessageContract.parse('Created .claude/settings.json with hooks'),
  };
};
