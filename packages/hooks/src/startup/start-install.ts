/**
 * PURPOSE: Install hooks package by creating/updating .claude/settings.json in target project
 *
 * USAGE:
 * const result = await StartInstall({ context });
 * // Creates .claude/settings.json with hooks or merges into existing, skips if already configured
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
import type { ClaudeSettings } from '../contracts/claude-settings/claude-settings-contract';
import { dungeonmasterHooksCreatorTransformer } from '../transformers/dungeonmaster-hooks-creator/dungeonmaster-hooks-creator-transformer';

const SETTINGS_DIR = '.claude';
const SETTINGS_FILENAME = 'settings.json';
const PACKAGE_NAME = '@dungeonmaster/hooks';
const JSON_INDENT_SPACES = 2;

export const StartInstall = async ({
  context,
}: {
  context: InstallContext;
}): Promise<InstallResult> => {
  const settingsPath = pathJoinAdapter({
    paths: [context.targetProjectRoot, SETTINGS_DIR, SETTINGS_FILENAME],
  });

  let existingSettings: ClaudeSettings | null = null;

  try {
    const contents = await fsReadFileAdapter({ filePath: settingsPath });
    existingSettings = JSON.parse(contents) as ClaudeSettings;
  } catch {
    // File doesn't exist or is invalid JSON - will create new settings
  }

  // Check if dungeonmaster hooks are already configured
  if (existingSettings) {
    const settingsStr = JSON.stringify(existingSettings);
    if (settingsStr.includes('dungeonmaster')) {
      return {
        packageName: packageNameContract.parse(PACKAGE_NAME),
        success: true,
        action: 'skipped',
        message: installMessageContract.parse('Hooks already configured'),
      };
    }
  }

  const dungeonmasterHooks = dungeonmasterHooksCreatorTransformer();

  // Merge into existing settings or create new
  if (existingSettings) {
    const existingPreToolUse = existingSettings.hooks?.PreToolUse ?? [];
    // const existingPostToolUse = existingSettings.hooks?.PostToolUse ?? [];
    const existingSessionStart = existingSettings.hooks?.SessionStart ?? [];

    const mergedSettings: ClaudeSettings = {
      ...existingSettings,
      hooks: {
        ...existingSettings.hooks,
        PreToolUse: [...existingPreToolUse, ...dungeonmasterHooks.PreToolUse],
        // PostToolUse: [...existingPostToolUse, ...dungeonmasterHooks.PostToolUse],
        SessionStart: [...existingSessionStart, ...dungeonmasterHooks.SessionStart],
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

  // Create new settings file
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
