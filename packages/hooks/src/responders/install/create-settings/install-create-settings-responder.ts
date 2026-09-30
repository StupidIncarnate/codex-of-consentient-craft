/**
 * PURPOSE: Creates or merges dungeonmaster hooks into .claude/settings.json for a target project.
 * Re-runs are idempotent and additive: any prior dungeonmaster-* hook entries are stripped before the freshly-generated set is appended, so newly-added hook types (e.g. a new PostToolUse) land on every subsequent `dungeonmaster init` without manual cleanup.
 * Also writes the root-level session defaults from `sessionDefaultsCreatorTransformer`, configures Antigravity in .agents/ and symlinks AGENTS.md -> CLAUDE.md.
 *
 * A corrupt or unreadable settings.json (invalid JSON, EACCES) is left on disk untouched: the read
 * rejects, this responder does not catch it, and `installExecuteBroker` (the caller above `StartInstall`)
 * turns the rejection into a failed `InstallResult` naming the file. Only a genuinely ABSENT file
 * takes the 'created' branch — collapsing "unreadable" into "absent" is the data-loss bug this
 * replaces, since 'created' writes a fresh file over whatever was really there.
 *
 * USAGE:
 * const result = await InstallCreateSettingsResponder({ context });
 * // 'created' on fresh project, 'merged' on existing settings (preserves third-party entries).
 * // Throws when settings.json exists but cannot be read as JSON.
 *
 * The session defaults spread UNDER the consumer's own settings, so every one of those keys lands
 * on a fresh install and yields to whatever the consumer sets afterwards. `hooks` is the opposite
 * and spreads last, because dungeonmaster owns its own hook entries outright. `env` sits between
 * the two: it merges key by key, so the consumer's variables survive alongside the one added here.
 */

import {
  type InstallContext,
  type InstallResult,
  installResultContract,
} from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { jsonFileContentsTransformer } from '@dungeonmaster/shared/transformers';
import path from '#gateway/node/path';
import { readJsonFileIfExists, writeFileCreatingParent } from '#gateway/node/fs__promises';
import { installAgentsSetupBroker } from '../../../brokers/install/agents-setup/install-agents-setup-broker';
import { claudeSettingsContract } from '../../../contracts/claude-settings/claude-settings-contract';
import type { ClaudeSettings } from '../../../contracts/claude-settings/claude-settings-contract';
import { dungeonmasterHooksCreatorTransformer } from '../../../transformers/dungeonmaster-hooks-creator/dungeonmaster-hooks-creator-transformer';
import { sessionDefaultsCreatorTransformer } from '../../../transformers/session-defaults-creator/session-defaults-creator-transformer';
import { upsertDungeonmasterHookListTransformer } from '../../../transformers/upsert-dungeonmaster-hook-list/upsert-dungeonmaster-hook-list-transformer';

const PACKAGE_NAME = '@dungeonmaster/hooks';

export const InstallCreateSettingsResponder = async ({
  context,
}: {
  context: InstallContext;
}): Promise<InstallResult> => {
  const settingsPath = path.join(
    context.targetProjectRoot,
    locationsStatics.repoRoot.claude.dir,
    locationsStatics.repoRoot.claude.settings,
  );

  // A settings.json whose shape the contract rejects throws here, before anything is written: the
  // ZodError propagates like the read errors above, so the file on disk is never overwritten.
  const rawSettings = await readJsonFileIfExists(settingsPath);
  const existingSettings = rawSettings === null ? null : claudeSettingsContract.parse(rawSettings);

  const dungeonmasterHooks = dungeonmasterHooksCreatorTransformer();
  const sessionDefaults = sessionDefaultsCreatorTransformer();

  await installAgentsSetupBroker({ targetProjectRoot: context.targetProjectRoot });

  if (existingSettings) {
    const existingHooks = existingSettings.hooks ?? {};

    const mergedSettings: ClaudeSettings = {
      ...sessionDefaults,
      ...existingSettings,
      env: { ...sessionDefaults.env, ...existingSettings.env },
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

    const contents = jsonFileContentsTransformer({ value: mergedSettings });

    await writeFileCreatingParent(settingsPath, contents);

    return installResultContract.parse({
      packageName: PACKAGE_NAME,
      success: true,
      action: 'merged',
      message: 'Merged hooks into existing settings',
    });
  }

  const newSettings: ClaudeSettings = {
    ...sessionDefaults,
    hooks: dungeonmasterHooks,
  };

  const contents = jsonFileContentsTransformer({ value: newSettings });

  await writeFileCreatingParent(settingsPath, contents);

  return installResultContract.parse({
    packageName: PACKAGE_NAME,
    success: true,
    action: 'created',
    message: 'Created .claude/settings.json with hooks',
  });
};
