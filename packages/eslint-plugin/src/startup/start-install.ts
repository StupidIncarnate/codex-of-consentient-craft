/**
 * PURPOSE: Install eslint-plugin by creating eslint.config.js in target project
 *
 * USAGE:
 * const result = await StartInstall({ context });
 * // Creates eslint.config.js with dungeonmaster config or skips if already exists
 */

import {
  type InstallContext,
  type InstallResult,
  installMessageContract,
  packageNameContract,
  fileContentsContract,
} from '@dungeonmaster/shared/contracts';
import { pathJoinAdapter } from '../adapters/path/join/path-join-adapter';
import { fsExistsSyncAdapter } from '../adapters/fs/exists-sync/fs-exists-sync-adapter';
import { fsReadFileSyncAdapter } from '../adapters/fs/read-file-sync/fs-read-file-sync-adapter';
import { fsWriteFileSyncAdapter } from '../adapters/fs/write-file-sync/fs-write-file-sync-adapter';
import { eslintConfigFilesStatics } from '../statics/eslint-config-files/eslint-config-files-statics';

const PACKAGE_NAME = '@dungeonmaster/eslint-plugin';

const NEW_CONFIG_TEMPLATE = `const dungeonmaster = require('@dungeonmaster/eslint-plugin');
const tsparser = require('@typescript-eslint/parser');

module.exports = [
    {
        files: ['**/*.ts', '**/*.tsx'],
        languageOptions: {parser: tsparser},
        plugins: {'@dungeonmaster': dungeonmaster},
        rules: {...dungeonmaster.configs.recommended.rules},
    },
];
`;

export const StartInstall = ({ context }: { context: InstallContext }): InstallResult => {
  // Check for existing config files
  for (const configFile of eslintConfigFilesStatics) {
    const configPath = pathJoinAdapter({
      paths: [context.targetProjectRoot, configFile],
    });

    if (fsExistsSyncAdapter({ filePath: configPath })) {
      const content = fsReadFileSyncAdapter({ filePath: configPath });

      if (content.includes('@dungeonmaster')) {
        return {
          packageName: packageNameContract.parse(PACKAGE_NAME),
          success: true,
          action: 'skipped',
          message: installMessageContract.parse('ESLint already configured with dungeonmaster'),
        };
      }

      // Existing config without dungeonmaster - can't safely merge JS
      return {
        packageName: packageNameContract.parse(PACKAGE_NAME),
        success: true,
        action: 'skipped',
        message: installMessageContract.parse(
          `Found ${configFile} - please add @dungeonmaster/eslint-plugin manually`,
        ),
      };
    }
  }

  // No config exists - create new one
  const newConfigPath = pathJoinAdapter({
    paths: [context.targetProjectRoot, 'eslint.config.js'],
  });

  const contents = fileContentsContract.parse(NEW_CONFIG_TEMPLATE);

  fsWriteFileSyncAdapter({ filePath: newConfigPath, contents });

  return {
    packageName: packageNameContract.parse(PACKAGE_NAME),
    success: true,
    action: 'created',
    message: installMessageContract.parse('Created eslint.config.js'),
  };
};
